# p5kit

[English](README.md)

p5kit 是一个独立的开源工具包，用来把 p5.js sketch 封装成移动端 app。

p5kit 的目标是让你继续使用普通的 p5.js 语法创作，并把同一份代码打包到 iOS 和 Android，而不需要把 sketch 重写成 Swift、Kotlin 或原生 UI 框架。

```js
function setup() {
  createCanvas(windowWidth, windowHeight)
}

function draw() {
  background(20)
  circle(mouseX, mouseY, 80)
}
```

长期目标是做一个面向创意编程的轻量 app 框架：

```sh
npm create p5kit my-sketch
cd my-sketch

p5kit run ios
p5kit run android

p5kit build ios
p5kit build android
```

## 目录

- [项目状态](#项目状态)
- [架构](#架构)
- [原生能力](#原生能力)
- [为什么不直接用 Capacitor?](#为什么不直接用-capacitor)
- [路线图](#路线图)

## 项目状态

这个项目目前还处在最早期的规划阶段。

第一个里程碑是做一个轻量 app shell，把 p5.js sketch 封装进 iOS 和 Android 的原生容器中。p5.js 仍然通过浏览器 canvas runtime 渲染，而原生壳负责打包、权限、设备 API、app 生命周期和面向应用商店的构建流程。

## 架构

计划中的架构是：

```text
p5.js sketch
  -> web bundle
  -> iOS WKWebView / Android WebView
  -> shared JavaScript bridge
  -> native platform capabilities
```

共享层：

- `@p5kit/core`：runtime helper、生命周期约定、平台检测
- `@p5kit/cli`：项目创建、开发、构建命令
- `@p5kit/bridge`：共享的 JavaScript 到原生端 bridge 协议
- `@p5kit/templates`：起步模板和示例项目

平台层：

- `@p5kit/ios`：基于 Swift/SwiftUI 和 `WKWebView` 的 iOS app shell
- `@p5kit/android`：基于 Kotlin 和 Android `WebView` 的 Android app shell

## 原生能力

p5kit 应该通过一套小而一致的 JavaScript API 暴露移动端能力：

```js
await p5kit.vibrate()
await p5kit.share({ text: "Made with p5kit" })
await p5kit.saveCanvas()

const platform = await p5kit.platform()
```

第一批 native bridge 目标包括：

- 震动
- 分享
- 保存 canvas 输出
- 设备方向
- 运动和传感器数据
- 相机和媒体权限
- 音频解锁行为
- 全屏和安全区处理

## 为什么不直接用 Capacitor?

Capacitor 和 Cordova 已经可以把 web app 打包到移动端。p5kit 的不同之处在于，它是专门为 p5.js 和创意编程工作流设计的。

这个项目的目标不只是把网页放进 WebView，而是让 p5.js sketch 在移动端更自然地工作：处理 canvas 尺寸、触摸行为、传感器访问、音频差异、资源打包、调试、示例和平台构建细节。

## 路线图

1. 创建一个最小 p5.js 项目模板。
2. 用 SwiftUI 和 `WKWebView` 构建 iOS shell。
3. 用 Kotlin 和 `WebView` 构建 Android shell。
4. 添加 `p5kit run ios` 和 `p5kit run android`。
5. 添加两个平台的生产构建流程。
6. 定义第一版 native bridge API。
7. 发布使用触摸、传感器、音频和分享能力的示例 sketch。

p5kit 与 Processing Foundation 或 p5.js 没有关联。
