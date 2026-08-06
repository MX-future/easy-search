// 存储层：页面数据与索引的 JSON 持久化
// 支持多候选路径，兼容本地开发与 Netlify Functions 打包后的目录结构
const fs = require('fs');
const path = require('path');
const config = require('./config');

// 查找实际可用的数据目录（included_files 打包后位置与本地不同）
function resolveDataDir() {
  const candidates = [
    path.join(__dirname, '..', 'data', 'crawl'), // 本地开发（crawler/../data/crawl）
    path.join(process.cwd(), 'data', 'crawl'),   // Netlify 函数运行时 cwd
    path.join(__dirname, 'data', 'crawl'),       // 打包后与代码同级
    path.join(__dirname, '..', '..', 'data', 'crawl'), // 更深一层
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(path.join(c, config.INDEX_FILE))) return c;
    } catch { /* 忽略 */ }
  }
  return candidates[0];
}

function ensureDir() {
  fs.mkdirSync(resolveDataDir(), { recursive: true });
}

function pagesPath() {
  return path.join(resolveDataDir(), config.PAGES_FILE);
}

function indexPath() {
  return path.join(resolveDataDir(), config.INDEX_FILE);
}

function loadPages() {
  ensureDir();
  try {
    return JSON.parse(fs.readFileSync(pagesPath(), 'utf-8'));
  } catch {
    return [];
  }
}

function savePages(pages) {
  ensureDir();
  fs.writeFileSync(pagesPath(), JSON.stringify(pages, null, 1), 'utf-8');
}

function loadIndex() {
  ensureDir();
  try {
    return JSON.parse(fs.readFileSync(indexPath(), 'utf-8'));
  } catch {
    return { docs: [], terms: {} };
  }
}

function saveIndex(index) {
  ensureDir();
  fs.writeFileSync(indexPath(), JSON.stringify(index), 'utf-8');
}

module.exports = { loadPages, savePages, loadIndex, saveIndex, resolveDataDir };
