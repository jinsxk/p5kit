# Package Surface Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce p5kit's public npm surface to `create-p5kit`, `@p5kit/cli`, and `@p5kit/core`.

**Architecture:** Keep generated projects simple: sketches depend on `@p5kit/core`, `p5`, `@p5kit/cli`, and `vite`. Move bridge internals into core, move the basic template into `create-p5kit`, and remove standalone `@p5kit/bridge`, `@p5kit/templates`, and `@p5kit/ios` npm packages from the workspace.

**Tech Stack:** Node.js CLI, npm workspaces, ESM browser runtime, Vite smoke test.

---

### Task 1: Encode Package Surface Expectations

**Files:**
- Modify: `scripts/smoke-test.mjs`

- [ ] **Step 1: Write failing smoke assertions**

Add assertions that fail while the old package split remains:

```js
assertMissing(path.join(root, "packages", "bridge", "package.json"));
assertMissing(path.join(root, "packages", "templates", "package.json"));
assertMissing(path.join(root, "packages", "ios", "package.json"));
```

Also assert generated app dependencies do not include `@p5kit/bridge`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because old package directories still exist and generated apps still depend on `@p5kit/bridge`.

### Task 2: Merge Bridge Internals Into Core

**Files:**
- Modify: `packages/core/src/index.js`
- Modify: `packages/core/package.json`
- Delete: `packages/bridge/package.json`
- Delete: `packages/bridge/src/index.js`

- [ ] **Step 1: Move bridge functions into core**

Keep the same public core API and export `hasNativeBridge`, `nativePlatformName`, and `requestNative` directly from `@p5kit/core`.

- [ ] **Step 2: Remove core dependency on bridge**

Delete `@p5kit/bridge` from `packages/core/package.json`.

### Task 3: Inline Templates Into create-p5kit

**Files:**
- Modify: `packages/create-p5kit/bin/create-p5kit.js`
- Modify: `packages/create-p5kit/package.json`
- Create: `packages/create-p5kit/templates/basic/*`
- Delete: `packages/templates/package.json`
- Delete: `packages/templates/templates/basic/*`

- [ ] **Step 1: Copy the basic template under create-p5kit**

Generated `package.json` should depend on `@p5kit/core`, `p5`, `@p5kit/cli`, and `vite` only.

- [ ] **Step 2: Resolve templates from create-p5kit package files**

Remove the runtime `@p5kit/templates` dependency and resolve `templates/basic` relative to `packages/create-p5kit`.

### Task 4: Remove Standalone iOS npm Package

**Files:**
- Delete: `packages/ios/package.json`
- Move or delete: `packages/ios/*`
- Update docs that list `@p5kit/ios`

- [ ] **Step 1: Remove iOS from public package lists**

Docs should describe iOS shell resources as CLI-owned implementation work, not a public npm package.

### Task 5: Verify and Update Metadata

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `docs/development.md`
- Modify: `package-lock.json`

- [ ] **Step 1: Run npm install**

Run: `npm install`
Expected: workspace lockfile no longer includes removed packages.

- [ ] **Step 2: Run smoke test**

Run: `npm test`
Expected: generated app installs, builds web, builds iOS bundle, and package-surface assertions pass.
