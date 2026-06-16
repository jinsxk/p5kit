const DEFAULT_TIMEOUT_MS = 8000;

let nextRequestId = 1;
const pendingRequests = new Map();

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
