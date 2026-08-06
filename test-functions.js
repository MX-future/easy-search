// 本地模拟 Netlify Functions 调用（开发验证用，部署后删除）
// 用法: node test-functions.js "钢铁侠" all
const { handler: searchHandler } = require('./netlify/functions/search');
const { handler: healthHandler } = require('./netlify/functions/health');

const q = process.argv[2] || '钢铁侠';
const type = process.argv[3] || 'all';

(async () => {
  // 1. 健康检查
  const h = await healthHandler({});
  console.log('[health]', h.statusCode, h.body);

  // 2. 搜索
  const t0 = Date.now();
  const res = await searchHandler({ queryStringParameters: { q, type, limit: '8' } });
  const cost = Date.now() - t0;
  const data = JSON.parse(res.body);
  console.log(`[search] ${q} (${type}) -> HTTP ${res.statusCode} · ${cost}ms · ${data.total} 条`);
  if (data.errors && data.errors.length) {
    console.log('[errors]', data.errors.map((e) => `${e.provider}: ${e.message}`).join(' | '));
  }
  data.results.slice(0, 10).forEach((r) =>
    console.log(`  [${r.type}] ${(r.title || '').slice(0, 44)} | ${r.source}`)
  );
})();
