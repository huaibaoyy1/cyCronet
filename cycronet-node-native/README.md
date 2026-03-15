# cycronet-node-native

Node.js N-API 绑定层，等价于 Python 版本的 `cronet_cloak.pyd`。本项目直接复用 `cycronet-build` 的 Rust 实现，通过 `napi-rs` 暴露给 Node。

## 目录结构
- `src/lib.rs`: N-API 绑定（`CronetClient`）
- `Cargo.toml`: 依赖 `../cycronet-build`
- `package.json`: 使用 `@napi-rs/cli` 构建

## 构建 (Windows / MSVC)

1. 安装 Rust toolchain 和 Visual Studio Build Tools（含 MSVC）。
2. 进入目录并构建：
   ```
   cd cycronet-node-native
   npm install
   npm run build
   ```

构建完成后生成 `cycronet-node-native/cronet_cloak.node`。

## 在 Node SDK 中使用

把生成的 `cronet_cloak.node` 复制到 `cycronet-node/native/`，或设置 `require` 路径。

Node SDK 会先预加载 `cronet.*.dll`，再加载 `cronet_cloak.node`。

## 对外 API

导出类与 Python 对齐：

- `new CronetClient()`
- `createSession({ proxyRules, skipCertVerify, timeoutMs, cipherSuites, tlsCurves, tlsExtensions })`
- `request({ sessionId, url, method, headers, body, allowRedirects })`
- `closeSession(sessionId)`
- `listSessions()`