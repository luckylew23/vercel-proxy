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
