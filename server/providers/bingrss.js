// Bing RSS（国内版）：通用网页搜索兜底 + 按路由类型标记正版渠道
// 影视/音乐/软件分类下，结果标记为对应类型的正版官方渠道（平台观看页/官网）
const { fetchText } = require('./_http');

// 路由类型 -> 结果标记 + 查询限定词（提升分类相关性）
const ROUTE_META = {
  video: { type: 'video', source: '正版视频渠道', q: ' 电影 在线观看', fallback: '搜索到的影视相关内容（正版平台观看页/资讯）' },
  music: { type: 'music', source: '正版音乐渠道', q: ' 歌曲', fallback: '搜索到的音乐相关内容（正版音乐平台）' },
  software: { type: 'software', source: '正版软件渠道', q: ' 软件', fallback: '搜索到的软件/工具相关内容（官网/官方下载页）' },
};

// 影视分类仅保留主流正版平台（其余域名多为盗版/聚合站）
const VIDEO_WHITELIST = [
  'qq.com', 'iqiyi.com', 'youku.com', 'bilibili.com', 'mgtv.com', 'sohu.com',
  '1905.com', 'douban.com', 'baidu.com', 'sogou.com', 'weibo.com', '163.com', 'mtime.com',
];
// 音乐分类仅保留主流正版音乐平台与百科
const MUSIC_WHITELIST = [
  'y.qq.com', 'music.163.com', 'kugou.com', 'kuwo.cn', 'bilibili.com',
  'baike.baidu.com', 'music.apple.com', 'weibo.com', 'qq.com', '163.com',
];
// 所有分类统一过滤：盗版/磁力/下载站关键词
const BLOCK_KEYWORDS = [
  'torrent', 'bt种子', '磁力', 'magnet', 'thunder', 'xunlei', '迅雷',
  'yyets', 'btdig', 'btbtt', 'cili', 'subtitle', '字幕', '影视大全', '免费电影',
];

async function search(query, limit = 10, opts = {}) {
  const meta = ROUTE_META[opts.type] || null;
  const searchTerm = meta ? `${query}${meta.q}` : query;
  const url = `https://cn.bing.com/search?q=${encodeURIComponent(searchTerm)}&format=rss&count=${limit}`;
  const xml = await fetchText(url, { timeoutMs: 8000 });
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

  const results = [];
  for (const it of items.slice(0, limit)) {
    const get = (tag) => {
      const m = it.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      return m ? decodeXml(m[1]).trim() : '';
    };
    const link = get('link');
    const title = get('title');
    const host = safeHost(link);

    // 统一过滤盗版/磁力/下载站关键词
    const joined = `${title} ${link}`.toLowerCase();
    if (BLOCK_KEYWORDS.some((k) => joined.includes(k.toLowerCase()))) continue;
    // 影视/音乐分类按正版平台白名单过滤
    if (opts.type === 'video' && !VIDEO_WHITELIST.some((d) => host.endsWith(d))) continue;
    if (opts.type === 'music' && !MUSIC_WHITELIST.some((d) => host.endsWith(d))) continue;

    results.push({
      id: `bingrss-${results.length}-${link}`,
      title,
      type: meta ? meta.type : 'general',
      source: meta ? meta.source : 'Bing 网页搜索',
      url: link,
      desc: get('description').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ') || (meta ? meta.fallback : 'Bing 搜索结果'),
      meta: host,
      image: null,
      extra: {},
    });
  }
  return results;
}

function decodeXml(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function safeHost(u) {
  try { return new URL(u).host.replace('www.', ''); } catch { return ''; }
}

module.exports = { search, name: 'Bing 搜索' };
