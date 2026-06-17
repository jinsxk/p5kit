// swift-tools-version: 5.10

import PackageDescription

let package = Package(
  name: "P5KitIOS",
  platforms: [
    .iOS(.v16)
  ],
  products: [
    .library(
      name: "P5KitIOS",
      targets: ["P5KitIOS"]
    )
  ],
  targets: [
    .target(
      name: "P5KitIOS"
    )
  ]
)
