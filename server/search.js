// 聚合调度器：并发调用各数据源，归一化、去重、排序
const itunes = require('./providers/itunes');
const github = require('./providers/github');
const openalex = require('./providers/openalex');
const iconify = require('./providers/iconify');
const bingrss = require('./providers/bingrss');
const bing = require('./providers/bing');

// 类型 -> 参与搜索的 provider
const TYPE_ROUTES = {
  all: ['itunes', 'github', 'openalex', 'iconify', 'bingrss', 'bing'],
  software: ['github', 'itunes'],
  video: ['itunes', 'bingrss'],
  music: ['itunes'],
  paper: ['openalex'],
  image: ['iconify'],
  document: ['bingrss', 'openalex', 'itunes'],
  general: ['bingrss', 'bing'],
};

const PROVIDERS = { itunes, github, openalex, iconify, bingrss, bing };

// 展示顺序权重（同类型内按来源优先级排）
const SOURCE_RANK = {
  'GitHub 开源': 1,
  'Apple TV/iTunes 正版': 2,
  'Apple Music/iTunes 正版': 3,
  'App Store 正版': 4,
  'OpenAlex 学术': 5,
  '正版视频渠道': 6,
  'Iconify 图标库': 7,
  'Bing 网页搜索': 8,
  'Bing 网页': 9,
};

async function search(query, type = 'all', limit = 12) {
  const routes = TYPE_ROUTES[type] || TYPE_ROUTES.all;
  const tasks = routes.map((name) =>
    PROVIDERS[name]
      .search(query, limit, { type })
      .then((items) => items.map((it) => ({ ...it, provider: name })))
      .catch((e) => ({ __error: { provider: name, message: e.message } }))
  );

  const settled = await Promise.allSettled(tasks);
  const errors = [];
  const results = [];

  for (const s of settled) {
    if (s.status === 'rejected') {
      errors.push({ provider: 'unknown', message: s.reason?.message || 'unknown error' });
    } else if (s.value && s.value.__error) {
      errors.push(s.value.__error);
    } else if (Array.isArray(s.value)) {
      results.push(...s.value);
    }
  }

  return {
    query,
    type,
    total: results.length,
    results: dedupe(results).sort(rankSort),
    errors,
    providers: routes.map((r) => ({ name: r, label: PROVIDERS[r].name })),
  };
}

// 去重：同一 URL 域名 + 标题近似
function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    let host = '';
    try { host = new URL(it.url).host.replace(/^www\./, ''); } catch { /* ignore */ }
    const titleKey = String(it.title || '').slice(0, 24).toLowerCase();
    const key = `${host}|${titleKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

function rankSort(a, b) {
  // 同类型优先按来源权重
  if (a.type === b.type) {
    return (SOURCE_RANK[a.source] || 99) - (SOURCE_RANK[b.source] || 99);
  }
  const order = ['software', 'video', 'music', 'image', 'paper', 'document', 'general'];
  return order.indexOf(a.type) - order.indexOf(b.type);
}

module.exports = { search, TYPE_ROUTES };
