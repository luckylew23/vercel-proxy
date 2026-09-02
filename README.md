# SCF API Proxy — 腾讯云函数极简 API 代理

零依赖、单文件的反向代理，部署在**腾讯云函数（SCF）**上，通过 **API 网关**触发，把收到的请求原样转发到目标服务。基于 Node 18+ 原生 `fetch`，代码无任何硬编码的部署信息，所有配置来自环境变量或 `config.json`。

## 文件结构（仅 3 个核心文件）

```
scf-api-proxy/
├── index.js     # 代理逻辑（唯一源文件，零依赖）
├── config.json  # 配置文件（targetHost / timeout / cors）
└── package.json # 元信息（声明 Node 运行版本）
```

## 配置

优先级：**环境变量 `TARGET_HOST`  >  `config.json` 的 `targetHost`**。

`config.json` 字段：

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `targetHost` | 是 | 目标服务地址（可带或不带 `https://`，会去掉末尾 `/`） | `https://api.example.com` |
| `timeout` | 否 | 上游超时（毫秒），默认 `10000` | `10000` |
| `cors` | 否 | 回传的 `Access-Control-Allow-Origin`，默认 `*` | `*` 或 `https://app.com` |

> 未配置 `targetHost` 时，函数直接返回 `HTTP 500`，不会静默失败。

## 本地验证（任选）

```bash
TARGET_HOST=https://api.example.com node -e "
const { main_handler } = require('./index.js');
main_handler({ httpMethod:'GET', path:'/health', queryString:{}, headers:{} })
  .then(r => console.log(r.statusCode, Buffer.from(r.body,'base64').toString().slice(0,200)));
"
```

## 部署到腾讯云函数（样例）

### 方式一：控制台部署

1. [SCF 控制台](https://console.cloud.tencent.com/scf) → **新建函数**
2. 创建方式选 **自定义创建**，函数类型选 **事件函数**
3. 运行环境选 **Node.js 18 / 20 / 22**（建议 22，最新稳定）
4. 执行方法填 **`index.main_handler`**
5. 上传 `index.js` + `config.json` + `package.json`（或打成 zip 上传）
6. **函数配置 → 环境变量** 添加 `TARGET_HOST=https://你的目标服务`
7. 触发管理 → 创建 **API 网关** 触发（前端类型「HTTP 服务」），获得访问 URL

### 方式二：Serverless Framework（Tencent 组件）

在 `serverless.yml` 中（此文件可按需自建，不在仓库内）：

```yaml
component: scf
name: scf-api-proxy
inputs:
  name: scf-api-proxy
  runtime: Nodejs18.17
  handler: index.main_handler
  region: ap-guangzhou
  environment:
    variables:
      TARGET_HOST: https://api.example.com
  events:
    - apigw:
        parameters:
          serviceName: scf-api-proxy
          protocols:
            - https
```

部署：`sls deploy`；移除：`sls remove`。

## 特性

- **零依赖** — 仅用 Node 原生 `fetch`，冷启动快
- **全方法** — GET / POST / PUT / DELETE / PATCH / OPTIONS（OPTIONS 直接返回 204 预检）
- **二进制安全** — 响应体 base64 传输，支持图片、文件等
- **重定向重写** — `Location` 改写为相对路径，避免客户端绕过代理
- **超时保护** — `timeout` 控制，慢请求返回 504，不会卡死函数
- **配置外置** — 无硬编码域名 / 区域 / 密钥

## License

MIT
