// Bing 国内版 RSS：通用网页搜索（无需 key，国内可访问）
// 兜底通用搜索，可覆盖百科、官网、新闻等网页结果
const { fetchText } = require('./_http');

async function search(query, limit = 10, opts = {}) {
  const url = `https://cn.bing.com/search?q=${encodeURIComponent(query)}&format=rss&count=${limit}`;
  const xml = await fetchText(url, { timeoutMs: 8000 });
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

  return items.slice(0, limit).map((it, i) => {
    const get = (tag) => {
      const m = it.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      return m ? decodeXml(m[1]).trim() : '';
    };
    const link = get('link');
    const isVideoRoute = opts.type === 'video';
    return {
      id: `bingrss-${i}-${link}`,
      title: get('title'),
      // 影视分类下，把网页结果归类为影视（正版平台观看页/资讯页）
      type: isVideoRoute ? 'video' : 'general',
      source: isVideoRoute ? '正版视频渠道' : 'Bing 网页搜索',
      url: link,
      desc: get('description').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ') || (isVideoRoute ? '搜索到的影视相关内容（正版平台观看页/资讯）' : 'Bing 搜索结果'),
      meta: safeHost(link),
      image: null,
      extra: {},
    };
  });
}

function safeHost(u) {
  try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; }
}

function decodeXml(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

module.exports = { search, name: 'Bing 网页搜索' };
