# Agents Instructions

## Git 提交规范

默认使用“英文类型/作用域 + 中文摘要”的 commit 标题格式：

```text
type(scope): 中文摘要
```

`type` 和 `scope` 使用英文，冒号后写中文；无作用域时使用：

```text
type: 中文摘要
```

示例：

```text
docs: 新增页面结构树
fix(widget): 用 widgetRenderingMode 正确判断 iOS 26 clear/tinted 模式
refactor(dropin): 将 DropInViews 按职责拆分
merge: feature/dropin-city-region-i18n → main（城市规范化 + 名称换行）
```

commit 正文使用中文，说明改了什么、为什么改、如何验证。

仅当用户明确要求、上游规范要求或第三方自动化要求时，才使用全英文 commit。
