// 爬虫配置：种子站点、限速、深度、黑名单
// 合规原则：仅抓取公开页面、遵守 robots.txt、礼貌限速、排除盗版/侵权内容站

const SEED_URLS = [
  'https://www.ruanyifeng.com/blog/',
  'https://sspai.com/',
  'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript',
  'https://www.infoq.cn/',
];

// 抓取深度（0=仅种子页，1=种子页+其直接链接，以此类推）
const MAX_DEPTH = 1;

// 每个域名最多抓取页数（礼貌限制）
const MAX_PAGES_PER_DOMAIN = 12;

// 同一域名两次请求的最小间隔（毫秒）
const REQUEST_INTERVAL_MS = 1500;

// 单页抓取超时
const FETCH_TIMEOUT_MS = 6000;

// 单次任务总页数上限
const MAX_TOTAL_PAGES = 60;

// 用户代理（标识爬虫身份与联系方式，供站长联系）
const USER_AGENT = 'ResourceCrawler/1.0 (+https://github.com/MX-future/easy-search; contact: MX-future)';

// 黑名单：命中域名关键词或标题关键词则不抓取/不索引（盗版/磁力/影视下载等）
const BLOCK_DOMAIN_KEYWORDS = [
  'torrent', 'bt', 'cili', 'magnet', 'thunder', 'xunlei', 'yyets',
  'subtitle', 'zimu', 'movie', 'film', 'dianying', 'yingshi',
];
const BLOCK_TITLE_KEYWORDS = [
  '磁力', '种子下载', '迅雷下载', '高清下载', '免费电影', '盗版',
];

// 存储路径
const DATA_DIR = require('path').join(__dirname, '..', 'data', 'crawl');
const PAGES_FILE = 'pages.json';
const INDEX_FILE = 'index.json';

module.exports = {
  SEED_URLS,
  MAX_DEPTH,
  MAX_PAGES_PER_DOMAIN,
  REQUEST_INTERVAL_MS,
  FETCH_TIMEOUT_MS,
  MAX_TOTAL_PAGES,
  USER_AGENT,
  BLOCK_DOMAIN_KEYWORDS,
  BLOCK_TITLE_KEYWORDS,
  DATA_DIR,
  PAGES_FILE,
  INDEX_FILE,
};
