// 资源聚合搜索服务入口
const path = require('path');
const express = require('express');
const config = require('./config');
const aggregator = require('./search');

const app = express();
app.use(express.json());

// 静态资源
app.use(express.static(path.join(__dirname, '..', 'public')));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// 聚合搜索接口
// GET /api/search?q=钢铁侠&type=all&limit=12
app.get('/api/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const type = String(req.query.type || 'all').trim();
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 20);

  if (!q) {
    return res.status(400).json({ error: '缺少搜索关键词 q' });
  }
  if (!aggregator.TYPE_ROUTES[type]) {
    return res.status(400).json({ error: `不支持的资源类型: ${type}` });
  }

  try {
    const result = await aggregator.search(q, type, limit);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: '搜索服务内部错误', message: e.message });
  }
});

app.listen(config.port, () => {
  console.log(`\n  🔍 资源聚合搜索服务已启动`);
  console.log(`  ➜ 本地访问:  http://localhost:${config.port}`);
  console.log(`  ➜ 搜索示例:  http://localhost:${config.port}/api/search?q=钢铁侠\n`);
});
