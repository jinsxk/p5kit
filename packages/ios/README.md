# @p5kit/ios

Swift Package containing the minimal iOS `WKWebView` shell component for p5kit.

```swift
import SwiftUI
import P5KitIOS

struct ContentView: View {
  var body: some View {
    P5KitWebView(bundleURL: P5KitShell.webBundleURL())
      .ignoresSafeArea()
  }
}
```

The package expects a copied web bundle containing `index.html`.
