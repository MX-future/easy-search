// 本地爬虫索引数据源：从 data/crawl/index.json 检索
// 索引由 `npm run crawl` 生成；提交 index.json 到仓库后，Netlify 部署自动包含
const store = require('../../crawler/store');
const { searchIndex } = require('../../crawler/indexer');

let cached = null; // 模块级缓存，Netlify 函数热实例间复用
function getIndex() {
  if (!cached) cached = store.loadIndex();
  return cached;
}

async function search(query, limit = 8) {
  try {
    const index = getIndex();
    if (!index.docs || index.docs.length === 0) return [];
    const hits = searchIndex(index, query, limit);
    return hits.map((h, i) => ({
      id: `crawl-${i}-${h.url}`,
      title: h.title,
      type: 'general',
      source: '本地爬虫索引',
      url: h.url,
      desc: h.desc || '本地索引收录的公开页面',
      meta: `本地索引 · 相关度 ${h.score}`,
      image: null,
      extra: {},
    }));
  } catch {
    // 索引文件不存在或损坏时静默降级
    return [];
  }
}

module.exports = { search, name: '本地爬虫索引' };
