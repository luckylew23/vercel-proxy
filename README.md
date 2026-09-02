# Vercel Proxy — 腾讯云 SCF 纯 API 代理

零依赖的轻量级反向代理，部署在腾讯云云函数 (SCF) 上，通过函数 URL 触发，将请求转发到 Vercel 应用。解决国内直连 Vercel 延迟高、超时或被阻断的问题。

## 部署信息

| 项目 | 值 |
|------|-----|
| 运行环境 | Node.js 12.16 |
| 入口文件 | `index.js` |
| 执行方法 | `index.main_handler` |
| 触发方式 | 函数 URL（免鉴权） |
| 内存 | 64MB |
| 超时 | 10s |
| 运行时依赖 | 零（仅用 Node 原生 `https` 模块） |

## 文件结构

```
vercel-proxy/
├── index.js        # 代理逻辑（唯一源文件，零依赖）
├── package.json    # 元信息
├── serverless.yml  # Serverless Framework 部署配置
├── .env.example    # 环境变量模板
├── .gitignore
├── LICENSE
└── README.md
```

---

## 部署方式一：CLI 从 GitHub 拉取部署（推荐）

### 第 1 步：克隆仓库

```bash
git clone https://github.com/luckylew23/vercel-proxy.git
cd vercel-proxy
```

### 第 2 步：安装 Serverless Framework

```bash
npm install -g serverless
```

### 第 3 步：配置腾讯云凭证

在 [腾讯云 API 密钥管理](https://console.cloud.tencent.com/cam/capi) 获取 `SecretId` 和 `SecretKey`，然后执行：

```bash
sls config set --secretId your-secret-id --secretKey your-secret-key
```

### 第 4 步：配置目标域名

复制环境变量模板并编辑：

```bash
cp .env.example .env
```

打开 `.env` 文件，将 `TARGET_HOST` 改为你的 Vercel 域名：

```env
TARGET_HOST=my-app.vercel.app
```

> `.env` 已被 `.gitignore` 忽略，不会提交到仓库。域名不含 `https://`，只填主机名。

### 第 5 步：部署

```bash
sls deploy
```

部署成功后，终端输出类似：

```
  functionUrl: https://vercel-proxy-xxxxx.ap-guangzhou.function.tencentyun.com/
```

这个 URL 就是你的代理地址，所有请求会被转发到你的 Vercel 应用。

### 第 6 步：验证

```bash
# 替换为你的函数 URL
curl https://vercel-proxy-xxxxx.ap-guangzhou.function.tencentyun.com/api/users
```

应返回与直接访问 `https://my-app.vercel.app/api/users` 相同的内容。

### 移除部署

```bash
sls remove
```

---

## 部署方式二：腾讯云控制台手动部署

### 第 1 步：下载代码

从 [GitHub 仓库](https://github.com/luckylew23/vercel-proxy) 下载 ZIP 或克隆代码，只需要 `index.js` 一个文件。

### 第 2 步：创建函数

1. 登录 [腾讯云 SCF 控制台](https://console.cloud.tencent.com/scf)
2. 点击 **新建**
3. 函数类型选 **Web 函数**
4. 函数名称填 `vercel-proxy`
5. 运行环境选 **Node.js 12.16**
6. **执行方法** 填 `index.main_handler`
7. 上传方式选 **本地上传**，选择 `index.js` 文件
8. 点击 **下一步**

### 第 3 步：配置环境变量

在 **函数配置 → 环境变量** 中添加：

| 键 | 值 |
|----|-----|
| `TARGET_HOST` | `my-app.vercel.app` |

> 替换为你的 Vercel 域名，不含 `https://`。

### 第 4 步：调整资源配置

| 配置项 | 值 |
|--------|-----|
| 内存 | 64MB |
| 执行超时 | 10 秒 |

### 第 5 步：完成创建

点击 **完成**，等待部署完成（状态变为「部署成功」）。

### 第 6 步：开启函数 URL

1. 进入函数详情 → **触发管理**
2. 点击 **函数 URL** → **创建**
3. 鉴权方式选 **免鉴权**
4. 点击保存，获得函数 URL 地址

### 第 7 步：验证

用浏览器或 curl 访问函数 URL，请求会被代理到你的 Vercel 应用。

---

## 配置说明

| 环境变量 | 必填 | 说明 | 示例 |
|----------|------|------|------|
| `TARGET_HOST` | 是 | 目标 Vercel 域名（不含 `https://` 和路径） | `my-app.vercel.app` |

- **CLI 部署**：写在 `.env` 文件中，`serverless.yml` 通过 `${env:TARGET_HOST}` 引用
- **控制台部署**：在函数的环境变量配置界面直接填写
- **未配置时**：函数返回 HTTP 500 + `{"error":"TARGET_HOST is not set"}`，不会静默失败

---

## 特性

- **零依赖** — 仅用 Node.js 原生 `https` 模块，冷启动 < 100ms
- **全方法** — GET / POST / PUT / DELETE / PATCH / OPTIONS
- **CORS 预检** — OPTIONS 请求直接返回 204，不转发到目标
- **二进制安全** — 响应体 base64 编码传输，支持图片、字体、文件等
- **重定向重写** — 自动将 Location 头改写为相对路径，防止客户端绕过代理直连目标
- **超时保护** — 10s 超时，慢请求不会卡死函数

## 注意事项

- 确保你的 Vercel 项目在海外可正常访问
- 函数 URL 免鉴权，任何人可访问，请勿用于敏感接口
- 如需鉴权，在 `serverless.yml` 中将 `authType` 改为 `FUNCTION`
- 如需自定义域名，在 SCF 控制台 → 函数 URL → 域名配置 中绑定

## License

MIT
