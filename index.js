const https = require('https');
const TIMEOUT = 10000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

exports.main_handler = async (event, context) => {
  if (context && 'callbackWaitsForEmptyEventLoop' in context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  const method = (event.httpMethod || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const targetHost = process.env.TARGET_HOST;
  if (!targetHost) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      body: JSON.stringify({ error: 'TARGET_HOST is not set', hint: 'Set TARGET_HOST env var, e.g. my-app.vercel.app' }),
    };
  }

  const path = event.path || '/';
  const query = event.queryString || {};
  const queryString = Object.keys(query).length
    ? '?' + new URLSearchParams(query).toString()
    : '';

  const body = event.body
    ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64') : Buffer.from(event.body))
    : Buffer.alloc(0);

  return new Promise((resolve) => {
    const options = {
      hostname: targetHost,
      port: 443,
      path: path + queryString,
      method: method,
      headers: {
        ...event.headers,
        host: targetHost,
        'accept-encoding': 'gzip, deflate',
      },
      timeout: TIMEOUT,
    };

    delete options.headers['content-length'];
    delete options.headers['connection'];

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const respHeaders = {
          ...res.headers,
          ...CORS_HEADERS,
          'Content-Type': res.headers['content-type'] || 'application/json',
        };
        delete respHeaders['content-length'];
        delete respHeaders['transfer-encoding'];
        if (respHeaders.location) {
          respHeaders.location = respHeaders.location.replace(
            new RegExp('https?://' + targetHost.replace(/\./g, '\\.'), 'g'), ''
          );
        }
        resolve({
          statusCode: res.statusCode,
          headers: respHeaders,
          body: buffer.toString('base64'),
          isBase64Encoded: true,
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        statusCode: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        body: Buffer.from(JSON.stringify({ error: 'Proxy Connection Failed', message: e.message })).toString('base64'),
        isBase64Encoded: true,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        statusCode: 504,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        body: Buffer.from(JSON.stringify({ error: 'Gateway Timeout' })).toString('base64'),
        isBase64Encoded: true,
      });
    });

    if (body && body.length > 0) {
      req.write(body);
    }
    req.end();
  });
};
