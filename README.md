# p5kit

[简体中文](README.zh-CN.md)

p5kit is an independent open-source toolkit for turning p5.js sketches into mobile apps.

p5kit aims to let you write ordinary p5.js sketches and package the same codebase for both iOS and Android, without rewriting your sketch in Swift, Kotlin, or a native UI framework.

```js
function setup() {
  createCanvas(windowWidth, windowHeight)
}

function draw() {
  background(20)
  circle(mouseX, mouseY, 80)
}
```

The long-term goal is a focused app framework for creative coding:

```sh
npm create p5kit my-sketch
cd my-sketch

p5kit run ios
p5kit run android

p5kit build ios
p5kit build android
```

## Contents

- [Project Status](#project-status)
- [Architecture](#architecture)
- [Native Capabilities](#native-capabilities)
- [Why Not Just Capacitor?](#why-not-just-capacitor)
- [Roadmap](#roadmap)

## Project Status

This project is currently in its earliest planning stage.

The first milestone is a lightweight app shell that packages a p5.js sketch inside native iOS and Android containers. p5.js continues to render through the browser canvas runtime, while the native shell handles packaging, permissions, device APIs, app lifecycle, and store-ready builds.

## Architecture

The intended architecture is:

```text
p5.js sketch
  -> web bundle
  -> iOS WKWebView / Android WebView
  -> shared JavaScript bridge
  -> native platform capabilities
```

Shared layers:

- `@p5kit/core`: runtime helpers, lifecycle conventions, platform detection
- `@p5kit/cli`: project creation, development, build commands
- `@p5kit/bridge`: shared JavaScript-to-native bridge protocol
- `@p5kit/templates`: starter projects and examples

Platform layers:

- `@p5kit/ios`: Swift/SwiftUI app shell using `WKWebView`
- `@p5kit/android`: Kotlin app shell using Android `WebView`

## Native Capabilities

p5kit should expose mobile features through a small, consistent JavaScript API:

```js
await p5kit.vibrate()
await p5kit.share({ text: "Made with p5kit" })
await p5kit.saveCanvas()

const platform = await p5kit.platform()
```

Initial native bridge targets include:

- vibration
- sharing
- saving canvas output
- device orientation
- motion and sensor data
- camera and media permissions
- audio unlock behavior
- fullscreen and safe-area handling

## Why Not Just Capacitor?

Capacitor and Cordova can already package web apps for mobile. p5kit is different because it is designed specifically for p5.js and creative coding workflows.

The goal is not just to put a web page in a WebView. The goal is to make p5.js sketches feel natural on mobile by handling canvas sizing, touch behavior, sensor access, audio quirks, asset packaging, debugging, examples, and platform-specific build details.

## Roadmap

1. Create a minimal p5.js project template.
2. Build an iOS shell with SwiftUI and `WKWebView`.
3. Build an Android shell with Kotlin and `WebView`.
4. Add `p5kit run ios` and `p5kit run android`.
5. Add production builds for both platforms.
6. Define the first version of the native bridge API.
7. Publish example sketches that use touch, sensors, audio, and sharing.

p5kit is not affiliated with the Processing Foundation or p5.js.
