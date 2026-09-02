'use strict';

// 极简 API 代理 —— 适配腾讯云函数（SCF）事件函数 + API 网关触发。
// 零依赖（仅用 Node 18+ 原生 fetch），所有配置来自环境变量或 config.json，不在代码中硬编码。

const DEFAULT_TIMEOUT = 10000;

// 转发时丢弃的请求头：这些头由运行环境/代理自身控制，不能原样透传。
const SKIP_REQ_HEADERS = new Set(['host', 'content-length', 'accept-encoding', 'connection']);
// 回传时丢弃的响应头：避免与代理层的传输编码/长度/跨域冲突。
const SKIP_RES_HEADERS = new Set(['content-length', 'content-encoding', 'transfer-encoding', 'connection', 'host']);

function loadConfig() {
  let file = {};
  try {
    file = require('./config.json');
  } catch {
    file = {};
  }
  const raw = process.env.TARGET_HOST || file.targetHost || '';
  const targetHost = raw ? (/^https?:\/\//.test(raw) ? raw : 'https://' + raw).replace(/\/+$/, '') : '';
  return {
    targetHost,
    timeout: Number(file.timeout) || DEFAULT_TIMEOUT,
    cors: file.cors ?? '*',
  };
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function targetUrl(event, base) {
  const path = event.path || '/';
  const qs = event.queryString || {};
  const search = Object.keys(qs).length ? '?' + new URLSearchParams(qs).toString() : '';
  return new URL(path + search, base + '/');
}

function requestBody(event) {
  if (!event.body) return undefined;
  return Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
}

function jsonError(status, message, cors) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(cors) },
    body: Buffer.from(JSON.stringify({ error: message })).toString('base64'),
    isBase64Encoded: true,
  };
}

async function proxy(event) {
  const config = loadConfig();
  if (!config.targetHost) {
    return jsonError(500, 'TARGET_HOST 未配置：设置环境变量 TARGET_HOST 或在 config.json 填写 targetHost', config.cors);
  }

  const method = (event.httpMethod || 'GET').toUpperCase();
  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(config.cors), body: '' };
  }

  const headers = {};
  for (const [k, v] of Object.entries(event.headers || {})) {
    if (!SKIP_REQ_HEADERS.has(k.toLowerCase())) headers[k] = v;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeout);
  try {
    const upstream = await fetch(targetUrl(event, config.targetHost), {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : requestBody(event),
      signal: controller.signal,
      redirect: 'manual',
    });

    const respHeaders = {};
    for (const [k, v] of upstream.headers) {
      if (!SKIP_RES_HEADERS.has(k.toLowerCase())) respHeaders[k] = v;
    }
    // 重定向 Location 改写为相对路径，防止客户端绕过代理直连上游。
    const location = upstream.headers.get('location');
    if (location) {
      const origin = config.targetHost.match(/^https?:\/\/[^/]+/)[0];
      respHeaders.location = location.replace(new RegExp('^' + origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '');
    }
    Object.assign(respHeaders, corsHeaders(config.cors));

    const buffer = Buffer.from(await upstream.arrayBuffer());
    return {
      statusCode: upstream.status,
      headers: respHeaders,
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    const timeout = err.name === 'AbortError';
    return jsonError(timeout ? 504 : 502, timeout ? 'Gateway Timeout' : 'Proxy Error', config.cors);
  } finally {
    clearTimeout(timer);
  }
}

exports.main_handler = proxy;
