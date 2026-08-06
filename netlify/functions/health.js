// Netlify Function: 健康检查（/api/health -> /.netlify/functions/health）
exports.handler = async () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ ok: true, time: new Date().toISOString() }),
});
