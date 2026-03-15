#!/usr/bin/env node
'use strict';

/**
 * 使用 Node.js 发送 TLS 验证请求
 * 与 tls_verify.py 行为保持一致
 */

const { setTimeout: sleep } = require('timers/promises');
const https = require('https');

const PROXY_HOST = '127.0.0.1';
const PROXY_PORT = 21882;
const PROXY_USERNAME = 'admin';
const PROXY_PASSWORD = 'admin';

const USE_PROXY = false; // 设为 false 禁用代理

function getProxyAgent(targetUrl) {
  if (!USE_PROXY) return undefined;
  const proxyUrl = `http://${PROXY_USERNAME}:${PROXY_PASSWORD}@${PROXY_HOST}:${PROXY_PORT}`;
  if (targetUrl.startsWith('https:')) {
    const { HttpsProxyAgent } = require('https-proxy-agent');
    return new HttpsProxyAgent(proxyUrl);
  }
  const { HttpProxyAgent } = require('http-proxy-agent');
  return new HttpProxyAgent(proxyUrl);
}

function createHeaders() {
  const headersList = [
    ['user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'],
    ['sec-ch-ua-platform', '"macOS"'],
    ['sec-ch-ua', '"Google Chrome";v="144", "Chromium";v="144", "Not?A_Brand";v="24"'],
    ['sec-ch-ua-mobile', '?0'],
    ['origin', 'https://tls.jsvmp.top:38080'],
    ['accept-language', 'zh-CN,zh;q=0.9'],
    ['referer', 'https://tls.jsvmp.top:38080/verify.htmdsadsadasdl'],
    ['accept-encoding', 'gzip, deflate, br'],
    ['priority', 'u=1, i'],
  ];

  const headers = new Headers();
  for (const [name, value] of headersList) {
    headers.append(name, value);
  }
  return headers;
}

function buildAgent() {
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });
  return (parsedUrl) => {
    if (USE_PROXY) {
      return getProxyAgent(parsedUrl.href);
    }
    if (parsedUrl.protocol === 'https:') {
      return httpsAgent;
    }
    return undefined;
  };
}

function printHeaders(response) {
  for (const [name, value] of response.headers) {
    console.log(`      ${name}: ${value}`);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('CronetClient TLS 验证测试 (Node.js)');
  console.log('='.repeat(60));

  if (USE_PROXY) {
    console.log(`[*] 使用代理: ${PROXY_HOST}:${PROXY_PORT}`);
  } else {
    console.log('[*] 直连模式 (无代理)');
  }

  console.log('-'.repeat(60));

  const headers = createHeaders();
  const agent = buildAgent();
  const sessionId = `node-${Date.now()}`;

  try {
    console.log(`[+] 会话已创建: ${sessionId}`);

    // 请求 1: GET /verify.html
    console.log('\n[1] GET /verify.html');
    let response = await fetch('https://tls.jsvmp.top:38080/verify.html', {
      method: 'GET',
      headers,
      agent,
    });

    let bodyText = await response.text();
    console.log(`    Status: ${response.status}`);
    console.log('    响应Headers:');
    printHeaders(response);
    console.log(`    Body (前200字符): ${bodyText.slice(0, 200)}...`);

    await sleep(3000);

    // 请求 2: GET /static/slider.css
    console.log('\n[2] GET /static/slider.css');
    response = await fetch('https://tls.jsvmp.top:38080/static/slider.css', {
      method: 'GET',
      headers,
      agent,
    });

    bodyText = await response.text();
    console.log(`    Status: ${response.status}`);
    console.log('    响应Headers:');
    printHeaders(response);
    console.log(`    Body (前200字符): ${bodyText.slice(0, 200)}...`);

    await sleep(3000);

    // 请求 3: POST /api/verify_slider
    console.log('\n[3] POST /api/verify_slider');

    const postData = {
      d: 'GFEvXSEfMUhUU2QdYFYaAy4QRz9CURsFY0ALFjQSBz14AAYdLBZ_SRQFFA86XSMfRkN5VR0CUVscHzUVA1x6QSshTQIPUxVVJksWOU4-dgByb0JYFkIcb3FIBR0kLRVWCggWYAxUVF1rAmVDEiI6KxodYlwaBixVcipTUxpYYTkYRi4MB2AIU1BdaBp1RWlKPQcwUDBZXFh6Qht8BhpZUzYfElAzCBQqS0VZFTlYNg51SAIHOFY3URQIa08XNVgVNj9jVlJELQAWKVYVDlFiFggKOiMAEjNdYBxRGiAbUSBHaAceMQkzWzQPFm0DVVBLdBY2CCsPCwh0CzkSBAQtAV1tCgpAR3FWUlwkCAUnTUVZQmwAdUd7CQEKOUMGVQMZIVcPfQRFWVM1Ex1RGw4MKhtdQTIrXSRECgIPCDFZI1lRQWsbVDtZThA3NBQTdykEASQbXRcBLVE4R3sZCwUjQydvBwIiEFttChoWAhlONV8YCwwpb1YhQytZDB5sJV5eI0ADSgNZCBRXAAlfVww',
      t: 'csX4EkYjnfV1B0smIu5O08uqAzp4AabO9g',
    };

    const postHeaders = new Headers(headers);
    postHeaders.set('content-type', 'application/json');

    for (let i = 0; i < 3; i += 1) {
      response = await fetch('https://tls.jsvmp.top:38080/api/verify_slider', {
        method: 'POST',
        headers: postHeaders,
        agent,
        body: JSON.stringify(postData),
      });
    }

    bodyText = await response.text();
    console.log(`    Status: ${response.status}`);
    console.log('    响应Headers:');
    printHeaders(response);
    console.log(`    Response: ${bodyText.slice(0, 500)}`);

    if (bodyText.includes('"success"')) {
      console.log('\n[+] tls验证成功');
    } else {
      console.log('\n[-] tls验证失败');
    }

    console.log(`\n[+] 会话已关闭: ${sessionId}`);
    console.log('\n' + '='.repeat(60));
    console.log('测试完成');
    console.log('='.repeat(60));
  } catch (error) {
    console.log(`[-] 错误: ${error?.name || 'Error'}: ${error?.message || error}`);
  }
}

if (require.main === module) {
  main();
}