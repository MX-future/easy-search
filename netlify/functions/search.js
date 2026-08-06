// Netlify Function: 聚合搜索 API（/api/search -> /.netlify/functions/search）
// 复用 server/ 下的聚合调度与数据源适配器，Netlify 用 esbuild 自动打包
const aggregator = require('../../server/search');

exports.handler = async (event) => {
  try {
    const p = event.queryStringParameters || {};
    const q = String(p.q || '').trim();
    const type = String(p.type || 'all').trim();
    const limit = Math.min(Math.max(Number(p.limit) || 12, 1), 20);

    if (!q) return json(400, { error: '缺少搜索关键词 q' });
    if (!aggregator.TYPE_ROUTES[type]) {
      return json(400, { error: `不支持的资源类型: ${type}` });
    }

    const result = await aggregator.search(q, type, limit);
    return json(200, result);
  } catch (e) {
    console.error('[search] 内部错误:', e);
    return json(500, { error: '搜索服务内部错误', message: e.message });
  }
};

function json(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(data),
  };
}
