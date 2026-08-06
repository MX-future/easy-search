// 爬虫主流程：广度优先抓取 -> 解析 -> 建索引 -> 落盘
// 合规：遵守 robots.txt、礼貌限速、UA 标识、黑名单排除盗版站
// 用法: node crawler/crawler.js
const config = require('./config');
const Robots = require('./robots');
const parser = require('./parser');
const store = require('./store');
const { buildIndex } = require('./indexer');

// 全局状态
const robotsCache = new Map(); // host -> Robots
const lastRequestAt = new Map(); // host -> timestamp
const seenUrls = new Set();
const pages = [];
let totalPages = 0;

function isBlockedUrl(url) {
  const host = new URL(url).host.toLowerCase();
  return config.BLOCK_DOMAIN_KEYWORDS.some((k) => host.includes(k));
}

async function getRobots(url) {
  const { host } = new URL(url);
  if (robotsCache.has(host)) return robotsCache.get(host);
  const robots = new Robots();
  try {
    const res = await fetch(`https://${host}/robots.txt`, {
      signal: AbortSignal.timeout(4000),
      headers: { 'User-Agent': config.USER_AGENT },
    });
    if (res.ok) robots.parse(await res.text());
  } catch { /* robots.txt 不可获取则默认允许 */ }
  robotsCache.set(host, robots);
  return robots;
}

async function politeFetch(url) {
  const { host } = new URL(url);
  const now = Date.now();
  const last = lastRequestAt.get(host) || 0;
  const wait = config.REQUEST_INTERVAL_MS - (now - last);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt.set(host, Date.now());

  const res = await fetch(url, {
    signal: AbortSignal.timeout(config.FETCH_TIMEOUT_MS),
    redirect: 'follow',
    headers: { 'User-Agent': config.USER_AGENT, Accept: 'text/html' },
  });
  if (!res.ok) return null;
  const type = res.headers.get('content-type') || '';
  if (!type.includes('text/html')) return null;
  return await res.text();
}

function extractPage(raw, url) {
  const title = parser.extractTitle(raw, url);
  const desc = parser.extractMetaDescription(raw);
  const text = parser.extractText(raw);
  return { url, title, desc, text, fetchedAt: new Date().toISOString() };
}

async function crawlUrl(url, depth) {
  if (totalPages >= config.MAX_TOTAL_PAGES) return;
  if (seenUrls.has(url) || isBlockedUrl(url)) return;
  seenUrls.add(url);

  const robots = await getRobots(url);
  const { pathname } = new URL(url);
  if (!robots.isAllowed(pathname)) {
    console.log(`  ⏭️  robots 禁止: ${url}`);
    return;
  }

  // 每域页数上限
  const host = new URL(url).host;
  if (pages.filter((p) => new URL(p.url).host === host).length >= config.MAX_PAGES_PER_DOMAIN) return;

  console.log(`  ⬇️  抓取 [深度${depth}] ${url}`);
  let raw = null;
  try {
    raw = await politeFetch(url);
  } catch (e) {
    console.log(`  ⚠️  抓取失败（${e.name || 'error'}），跳过: ${url}`);
    return;
  }
  if (!raw) {
    console.log(`  ⚠️  跳过（非 HTML/失败）: ${url}`);
    return;
  }

  const page = extractPage(raw, url);
  // 标题黑名单过滤（盗版/磁力内容不索引）
  if (config.BLOCK_TITLE_KEYWORDS.some((k) => page.title.includes(k))) {
    console.log(`  ⛔ 命中黑名单标题，不索引: ${url}`);
    return;
  }
  pages.push(page);
  totalPages++;

  // 下一层链接：仅递归同域链接（聚焦爬取，礼貌且可控）
  if (depth < config.MAX_DEPTH) {
    const links = parser.extractLinks(raw, url).slice(0, 40);
    for (const link of links) {
      if (seenUrls.has(link)) continue;
      let linkHost = '';
      try { linkHost = new URL(link).host; } catch { continue; }
      if (linkHost !== host) continue;
      await crawlUrl(link, depth + 1);
    }
  }
}

async function main() {
  console.log(`\n🔎 开始爬取（深度=${config.MAX_DEPTH}，每域≤${config.MAX_PAGES_PER_DOMAIN}页，总页数≤${config.MAX_TOTAL_PAGES}）`);
  console.log('   种子站点:');
  for (const s of config.SEED_URLS) console.log(`   - ${s}`);
  console.log('');

  for (const seed of config.SEED_URLS) {
    await crawlUrl(seed, 0);
  }

  console.log(`\n📦 抓取完成，共 ${pages.length} 页，开始构建索引...`);

  // 去掉空文本页
  const validPages = pages.filter((p) => p.text.trim().length > 50);
  const index = buildIndex(validPages);

  store.savePages(validPages);
  store.saveIndex(index);

  const termCount = Object.keys(index.terms).length;
  console.log(`✅ 索引完成：${validPages.length} 页 / ${termCount} 个词项`);
  console.log(`   数据已保存: data/crawl/pages.json + index.json`);
  console.log(`\n💡 提示: 提交 index.json 到仓库，Netlify 部署后搜索接口会自动带上爬虫结果\n`);
}

main().catch((e) => {
  console.error('爬取失败:', e);
  process.exit(1);
});
