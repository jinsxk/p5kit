import { hasNativeBridge, nativePlatformName, requestNative } from "@p5kit/bridge";

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
