// 通用请求工具：超时控制 + UA 伪装 + 错误归一化
const config = require('../config');

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || config.providerTimeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 ResourceSearch/1.0',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      ...(options.fetchOptions || {}),
    });
    if (!res.ok) {
      let detail = '';
      try {
        const body = await res.text();
        if (body && body.startsWith('{')) {
          const j = JSON.parse(body);
          detail = j.message || j.error || '';
        }
      } catch { /* ignore */ }
      throw new Error(`HTTP ${res.status}${detail ? ' ' + String(detail).slice(0, 120) : ''}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || config.providerTimeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 ResourceSearch/1.0',
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchJson, fetchText };
