# vercel-proxy
# Vercel Serverless Proxy (腾讯云 SCF 版)
        这是一个基于腾讯云云函数 (SCF) 和 API 网关构建的高性能反向代理项目。它旨在解决国内网络环境访问 Vercel 部署的应用（Web 或 API）时出现的连接超时、速度慢或被阻断的问题。
        本项目不仅包含核心代理逻辑，还集成了 **Serverless Framework** 自动化部署配置，支持一键发布到云端。
        ---
        ##  项目目录结构
        请在本地创建一个文件夹（例如 `vercel-proxy`），并在其中创建以下 5 个文件：
        
 vercel-proxy/
        ├── .gitignore            # Git 忽略配置      
        ├── index.js              # 云函数核心入口代码      
        ├── package.json          # Node.js 依赖配置
        ├── serverless.yml        # 腾讯云 Serverless 部署配置
        └── README.md             # 本说明文档


# Vercel Serverless Proxy

 一个极简的 Serverless 反向代理，基于腾讯云 SCF (Serverless Cloud Function) 构建。旨在解决国内网络环境下直连 Vercel 部署的 API 或前端应用延迟高、连接超时或被拦截的问题。

##  特性
- **零依赖**：仅使用 Node.js 原生 `https` 模块，冷启动极速。
- **Serverless**：基于腾讯云函数，免运维，按请求量计费，个人使用几乎零成本。
- **动态配置**：支持通过环境变量配置目标域名，无需修改代码即可切换代理目标。
- **全量转发**：完美支持 GET/POST 等所有 HTTP 方法，自动转发 Headers 和 Body。

## ️ 部署指南
### 1. 克隆项目
```bash
git clone https://github.com/你的用户名/vercel-serverless-proxy.git
```
### 2. 部署到腾讯云
1. 登录 腾讯云控制台，进入“云函数 SCF”。
2. 点击“新建”，函数类型务必选择 **Web函数**，运行环境选择 `Node.js 16.x` 或以上。
3. 将 `index.js` 代码粘贴到在线编辑器中，或将整个项目文件夹打包上传。
4. 在“环境变量”配置中，添加键 `VERCEL_TARGET_HOST`，值填入你的 Vercel 域名（例如：`my-app.vercel.app`）。
5. 点击“部署”。
### 3. 开启公网访问
在函数的“触发管理”中，添加 **API 网关触发器**，并勾选“开启公网访问”。部署成功后即可获得公网访问地址。
## ️ 注意事项
- 请确保您的 Vercel 项目本身在海外可以正常访问。
- 如果您的 Vercel 应用有复杂的 CORS 策略，可能需要在 Vercel 端配置允许腾讯云 API 网关的跨域请求。
- 建议为 API 网关绑定自定义域名，以获得更稳定的访问体验。
## License

MIT

```
---

### 5. `LICENSE` (MIT 开源协议)
```text
MIT License

Copyright (c) 2024 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
---

### 下一步操作建议
1. 将上述文件保存到您本地的 `vercel-serverless-proxy` 文件夹中。
2. 将 `README.md` 中的 `你的用户名` 替换为您的真实 GitHub ID。
3. 在终端执行以下命令推送到 GitHub：
