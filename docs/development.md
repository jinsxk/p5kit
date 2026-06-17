# Development Notes

This document is for contributors and maintainers. The README should stay focused on what visitors can install and use.

## Local Setup

Install workspace dependencies:

```sh
npm install
```

Run the smoke test:

```sh
npm test
```

The smoke test creates a temporary p5kit app, installs its dependencies, builds the web bundle, and prepares the iOS web bundle.

Create a local project from the current checkout:

```sh
node packages/create-p5kit/bin/create-p5kit.js my-sketch
cd my-sketch
npm install
npm run dev
npm run build
npm run build:ios
```

## Package Layout

- `create-p5kit`: project scaffolder used by `npm create p5kit`
- `@p5kit/cli`: CLI package that exposes the `p5kit` command
- `@p5kit/core`: runtime helpers, lifecycle conventions, platform detection, and JavaScript-to-native bridge internals

Starter templates live in `packages/create-p5kit/templates`. Native shell resources live under `packages/cli/native` until they are wired into generated mobile app projects.
- Android shell: planned Kotlin app shell using Android `WebView`

Do not publish an Android package until the Android shell exists.

## Architecture

The intended architecture is:

```text
p5.js sketch
  -> web bundle
  -> iOS WKWebView / Android WebView
  -> shared JavaScript bridge
  -> native platform capabilities
```

p5.js continues to render through the browser canvas runtime. The native shell handles packaging, permissions, device APIs, app lifecycle, and eventually store-ready builds.

## Native Capabilities

p5kit should expose mobile features through a small, consistent JavaScript API:

```js
await p5kit.vibrate();
await p5kit.share({ text: "Made with p5kit" });
await p5kit.saveCanvas();

const platform = await p5kit.platform();
```

Initial native bridge targets include:

- vibration
- sharing
- saving canvas output
- Apple Pencil pressure, tilt, azimuth, and feature-detected Pencil Pro extras such as squeeze, barrel roll, hover, and haptics
- gesture streams for pinch, rotate, pan, tap, and long press
- device orientation
- motion and sensor data
- camera and media permissions
- audio unlock behavior
- fullscreen and safe-area handling

## Why Not Just Capacitor?

Capacitor and Cordova can already package web apps for mobile. p5kit is different because it is designed specifically for p5.js and creative coding workflows.

The goal is not just to put a web page in a WebView. The goal is to make p5.js sketches feel natural on mobile by handling canvas sizing, touch behavior, sensor access, audio quirks, asset packaging, debugging, examples, and platform-specific build details.

## Roadmap

1. Create a minimal p5.js project template. Done for the basic web template.
2. Build an iOS shell with SwiftUI and `WKWebView`, owned by the CLI native resources. In progress with reusable Swift sources under `packages/cli/native/ios`.
3. Add `p5kit run ios` so the quickstart can build the web bundle, generate or sync the iOS app shell, open Simulator, and launch a real app.
4. Build an Android shell with Kotlin and `WebView`.
5. Add `p5kit run android` after the Android shell can build and launch a real app.
6. Add production builds for both platforms.
7. Define the first version of the native bridge API. Started with platform and vibration support.
8. Add a native event stream API for long-running inputs instead of only request/response bridge calls.
9. Map Apple Pencil input on iOS:
   - pressure from `UITouch.force / maximumPossibleForce`
   - tilt and direction from `altitudeAngle` and `azimuthAngle`
   - feature-detected Apple Pencil Pro extras such as squeeze, barrel roll, hover, and haptics
10. Map common creative-coding gestures:
   - pinch scale and velocity
   - rotation angle and velocity
   - pan translation and velocity
   - tap, double tap, long press, and pointer phase
11. Map Core Motion data:
   - device attitude
   - gyroscope rotation rate
   - accelerometer and user acceleration
   - gravity vector
   - configurable sampling rate and explicit start/stop lifecycle
12. Add `p5kit.capabilities()` so sketches can feature-detect Pencil, gesture, motion, haptics, camera, microphone, and file/share support.
13. Add creative-coding defaults and utilities worth doing after the first app loop:
   - haptic feedback helpers
   - safe-area and fullscreen helpers
   - orientation lock/read APIs
   - keep-awake mode for installations and performances
   - asset path helpers
   - file pick/save/share helpers
   - camera and microphone permissions once the app shell and privacy flow are stable
14. Publish example sketches that use touch, Pencil, gestures, sensors, audio, saving, and sharing.
