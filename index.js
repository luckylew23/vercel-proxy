        const https = require('https');
        const http = require('http');
        const url = require('url');
        // 设置超时时间（毫秒），防止慢请求卡死云函数
        const TIMEOUT = 30000; 
        exports.main_handler = async (event, context) => {       
         // 从环境变量获取目标域名，如果没有则使用默认值       
         const targetHost = process.env.TARGET_HOST || 'your-vercel-app.vercel.app';
         // 提取路径和参数
         let path = event.path || '/';
         // 腾讯云 API 网关有时候会把参数拼在 path 里，有时候在 queryString
         const query = event.queryString || {};
         const queryString = Object.keys(query).length 
           ? '?' + new URLSearchParams(query).toString() 
           : '';
         return new Promise((resolve, reject) => {
           // 根据目标地址自动判断协议 (Vercel 默认为 https)
           const requestLib = https; 
           const options = {       
             hostname: targetHost,       
             port: 443,       
             path: path + queryString,       
             method: event.httpMethod || 'GET',       
             headers: {       
               ...event.headers,       
               'host': targetHost, // 必须覆写 Host 头       
               'x-forwarded-for': event.requestContext?.sourceIp || '127.0.0.1',       
               'accept-encoding': 'gzip, deflate' // 接受压缩以提高速度       
             },       
             timeout: TIMEOUT       
           };
           // 移除一些会导致错误的请求头       
           delete options.headers['content-length'];        
           delete options.headers['connection'];
           const req = requestLib.request(options, (res) => {       
             let body = [];
              res.on('data', (chunk) => {
                body.push(chunk);
             });
              res.on('end', () => {       
               const buffer = Buffer.concat(body);  
               resolve({       
                 statusCode: res.statusCode,       
                 headers: {       
                   ...res.headers,       
                   'Access-Control-Allow-Origin': '*', // 允许跨域       
                   'Content-Type': res.headers['content-type'] || 'application/json'
                   },
                   body: buffer.toString('base64'), // 二进制安全传输       
                 isBase64Encoded: true       
               });       
             });       
           });
            req.on('error', (e) => {
             resolve({
               statusCode: 502,
               headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },       
               body: JSON.stringify({ error: 'Proxy Connection Failed', message: e.message })
                });
           });
            req.on('timeout', () => {
              req.destroy();
             resolve({
               statusCode: 504,
               headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
               body: JSON.stringify({ error: 'Gateway Timeout' })
             });
           });
           // 写入请求体 (处理 POST/PUT 数据)
           if (event.body) {       
             // 如果是 base64 编码的 body，先解码
              const bodyData = event.isBase64Encoded 
               ? Buffer.from(event.body, 'base64') 
               : event.body;
              req.write(bodyData);
           }
            req.end();
         });
        };
