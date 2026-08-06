// Bing Web Search API：通用网页搜索（可选，需 API key）
// 未配置 key 时该 provider 直接返回空数组
const config = require('../config');
const { fetchJson } = require('./_http');

async function search(query, limit = 8) {
  if (!config.bingApiKey) return [];
  const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${limit}&mkt=zh-CN`;
  const data = await fetchJson(url, {
    headers: { 'Ocp-Apim-Subscription-Key': config.bingApiKey },
    timeoutMs: 10000,
  });
  return (data.webPages?.value || []).map((r, i) => ({
    id: `bing-${i}-${r.url}`,
    title: r.name,
    type: 'general',
    source: 'Bing 网页',
    url: r.url,
    desc: r.snippet || '',
    meta: '通用网页搜索',
    image: null,
    extra: { host: safeHost(r.displayUrl) },
  }));
}

function safeHost(u) {
  try { return new URL(u).host.replace('www.', ''); } catch { return ''; }
}

module.exports = { search, name: 'Bing 网页' };
