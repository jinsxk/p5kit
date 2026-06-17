#if os(iOS)
import AudioToolbox
import SwiftUI
import UIKit
import WebKit

public enum P5KitShell {
  public static func webBundleURL(in bundle: Bundle = .main, subdirectory: String = "Web") -> URL {
    if let url = bundle.url(forResource: "index", withExtension: "html", subdirectory: subdirectory) {
      return url
    }

    return bundle.bundleURL.appendingPathComponent(subdirectory).appendingPathComponent("index.html")
  }
}

public struct P5KitWebView: UIViewRepresentable {
  private let bundleURL: URL
  private let allowsInspection: Bool

  public init(bundleURL: URL, allowsInspection: Bool = false) {
    self.bundleURL = bundleURL
    self.allowsInspection = allowsInspection
  }

  public func makeCoordinator() -> Coordinator {
    Coordinator()
  }

  public func makeUIView(context: Context) -> WKWebView {
    let configuration = WKWebViewConfiguration()
    configuration.allowsInlineMediaPlayback = true
    configuration.userContentController.add(context.coordinator, name: "p5kit")

    let webView = WKWebView(frame: .zero, configuration: configuration)
    webView.isOpaque = false
    webView.backgroundColor = .clear
    webView.scrollView.backgroundColor = .clear
    webView.scrollView.bounces = false
    webView.scrollView.contentInsetAdjustmentBehavior = .never
    webView.allowsBackForwardNavigationGestures = false

    if #available(iOS 16.4, *) {
      webView.isInspectable = allowsInspection
    }

    context.coordinator.webView = webView
    loadBundleURL(bundleURL, in: webView)
    context.coordinator.currentURL = bundleURL
    return webView
  }

  public func updateUIView(_ webView: WKWebView, context: Context) {
    if context.coordinator.currentURL != bundleURL {
      loadBundleURL(bundleURL, in: webView)
      context.coordinator.currentURL = bundleURL
    }
  }

  private func loadBundleURL(_ url: URL, in webView: WKWebView) {
    webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
  }

  public final class Coordinator: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?
    var currentURL: URL?

    public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
      guard message.name == "p5kit" else {
        return
      }

      guard
        let body = message.body as? [String: Any],
        let id = body["id"] as? String,
        let action = body["action"] as? String
      else {
        reject(id: nil, code: "invalid_message", message: "Invalid p5kit bridge message.")
        return
      }

      handle(action: action, id: id, payload: body["payload"] as? [String: Any] ?? [:])
    }

    private func handle(action: String, id: String, payload: [String: Any]) {
      switch action {
      case "platform":
        resolve(id: id, result: [
          "kind": "ios",
          "systemName": UIDevice.current.systemName,
          "systemVersion": UIDevice.current.systemVersion,
          "model": UIDevice.current.model
        ])
      case "vibrate":
        AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
        resolve(id: id, result: true)
      case "share":
        reject(id: id, code: "not_implemented", message: "Native sharing is not implemented in the iOS shell yet.")
      case "saveCanvas":
        reject(id: id, code: "not_implemented", message: "Native canvas saving is not implemented in the iOS shell yet.")
      default:
        reject(id: id, code: "unknown_action", message: "Unknown p5kit bridge action: \(action)")
      }
    }

    private func resolve(id: String, result: Any) {
      let script = "window.__p5kitBridge?.resolve(\(id.javascriptStringLiteral), \(jsonLiteral(result)))"
      webView?.evaluateJavaScript(script)
    }

    private func reject(id: String?, code: String, message: String) {
      guard let id else {
        return
      }

      let error: [String: Any] = [
        "code": code,
        "message": message
      ]
      let script = "window.__p5kitBridge?.reject(\(id.javascriptStringLiteral), \(jsonLiteral(error)))"
      webView?.evaluateJavaScript(script)
    }

    private func jsonLiteral(_ value: Any) -> String {
      if let bool = value as? Bool {
        return bool ? "true" : "false"
      }

      if let number = value as? NSNumber {
        return number.stringValue
      }

      if let string = value as? String {
        return string.javascriptStringLiteral
      }

      guard
        JSONSerialization.isValidJSONObject(value),
        let data = try? JSONSerialization.data(withJSONObject: value),
        let json = String(data: data, encoding: .utf8)
      else {
        return "null"
      }

      return json
    }
  }
}

private extension String {
  var javascriptStringLiteral: String {
    guard
      let data = try? JSONSerialization.data(withJSONObject: [self]),
      let json = String(data: data, encoding: .utf8),
      json.count >= 2
    else {
      return "\"\""
    }

    return String(json.dropFirst().dropLast())
  }
}
#endif
