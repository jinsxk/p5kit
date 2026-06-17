const DEFAULT_TIMEOUT_MS = 8000;

let nextRequestId = 1;
const pendingRequests = new Map();

export async function platform() {
  const fallback = webPlatformInfo();

  if (!hasNativeBridge()) {
    return fallback;
  }

  try {
    return await requestNative("platform", fallback);
  } catch {
    return fallback;
  }
}

export async function vibrate(pattern = 15) {
  if (hasNativeBridge()) {
    return requestNative("vibrate", { pattern });
  }

  if (globalThis.navigator && typeof globalThis.navigator.vibrate === "function") {
    return globalThis.navigator.vibrate(pattern);
  }

  return false;
}

export async function share(options = {}) {
  if (hasNativeBridge()) {
    return requestNative("share", options);
  }

  const navigator = globalThis.navigator;

  if (navigator && typeof navigator.share === "function") {
    await navigator.share(options);
    return { shared: true, target: "web-share" };
  }

  const shareText = [options.title, options.text, options.url].filter(Boolean).join("\n");

  if (shareText && navigator && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(shareText);
    return { shared: false, target: "clipboard" };
  }

  throw new Error("Sharing is not available in this environment.");
}

export async function saveCanvas(options = {}) {
  const canvas = resolveCanvas(options.canvas);
  const filename = options.filename || "p5kit-canvas.png";
  const mimeType = options.mimeType || "image/png";
  const dataUrl = canvas.toDataURL(mimeType);

  if (hasNativeBridge()) {
    return requestNative("saveCanvas", {
      dataUrl,
      filename,
      mimeType,
    });
  }

  downloadDataUrl(dataUrl, filename);
  return { saved: true, target: "download" };
}

export function installP5KitGlobal(target = globalThis) {
  const api = {
    platform,
    vibrate,
    share,
    saveCanvas,
    hasNativeBridge,
    nativePlatformName,
  };

  target.p5kit = api;
  return api;
}

export const p5kit = {
  platform,
  vibrate,
  share,
  saveCanvas,
  installP5KitGlobal,
  hasNativeBridge,
  nativePlatformName,
};

export function hasNativeBridge() {
  return Boolean(getNativeTarget());
}

export function nativePlatformName() {
  const target = getNativeTarget();
  return target ? target.platform : "web";
}

export function requestNative(action, payload = {}, options = {}) {
  const target = getNativeTarget();

  if (!target) {
    return Promise.reject(new Error("No p5kit native bridge is available."));
  }

  installResponseHandler();

  const id = `p5kit-${Date.now()}-${nextRequestId++}`;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const message = {
    id,
    action,
    payload,
  };

  return new Promise((resolve, reject) => {
    const timeout = globalThis.setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`Native bridge request timed out: ${action}`));
    }, timeoutMs);

    pendingRequests.set(id, {
      resolve,
      reject,
      timeout,
    });

    try {
      target.postMessage(message);
    } catch (error) {
      globalThis.clearTimeout(timeout);
      pendingRequests.delete(id);
      reject(error);
    }
  });
}

export function installResponseHandler() {
  const root = globalThis;
  const existing = root.__p5kitBridge || {};

  root.__p5kitBridge = {
    ...existing,
    resolve(id, result) {
      settleRequest(id, null, result);
    },
    reject(id, error) {
      settleRequest(id, normalizeNativeError(error));
    },
    receive(message) {
      const data = typeof message === "string" ? JSON.parse(message) : message;

      if (!data || !data.id) {
        throw new Error("Invalid p5kit bridge response.");
      }

      if (data.error) {
        settleRequest(data.id, normalizeNativeError(data.error));
        return;
      }

      settleRequest(data.id, null, data.result);
    },
  };

  return root.__p5kitBridge;
}

function webPlatformInfo() {
  const navigator = globalThis.navigator;

  return {
    kind: "web",
    bridge: nativePlatformName(),
    userAgent: navigator ? navigator.userAgent : "",
    language: navigator ? navigator.language : "",
    touch: navigator ? navigator.maxTouchPoints || 0 : 0,
  };
}

function resolveCanvas(canvas) {
  if (canvas) {
    return canvas;
  }

  if (!globalThis.document) {
    throw new Error("No document is available to find a p5.js canvas.");
  }

  const found = globalThis.document.querySelector("canvas");

  if (!found) {
    throw new Error("No canvas element was found.");
  }

  return found;
}

function downloadDataUrl(dataUrl, filename) {
  if (!globalThis.document) {
    throw new Error("Downloads are not available in this environment.");
  }

  const link = globalThis.document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";

  globalThis.document.body.appendChild(link);
  link.click();
  link.remove();
}

function settleRequest(id, error, result) {
  const pending = pendingRequests.get(id);

  if (!pending) {
    return;
  }

  pendingRequests.delete(id);
  globalThis.clearTimeout(pending.timeout);

  if (error) {
    pending.reject(error);
    return;
  }

  pending.resolve(result);
}

function normalizeNativeError(error) {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  if (error && typeof error.message === "string") {
    const normalized = new Error(error.message);
    normalized.code = error.code;
    return normalized;
  }

  return new Error("Native bridge request failed.");
}

function getNativeTarget() {
  const root = globalThis;

  if (root.webkit && root.webkit.messageHandlers && root.webkit.messageHandlers.p5kit) {
    return {
      platform: "ios",
      postMessage(message) {
        root.webkit.messageHandlers.p5kit.postMessage(message);
      },
    };
  }

  if (root.P5KitAndroid && typeof root.P5KitAndroid.postMessage === "function") {
    return {
      platform: "android",
      postMessage(message) {
        root.P5KitAndroid.postMessage(JSON.stringify(message));
      },
    };
  }

  return null;
}
