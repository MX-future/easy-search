// 页面解析器：提取标题/描述/正文纯文本/链接；中文分词（双字 bigram + 英文单词）
function extractTitle($, raw) {
  const m = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]).replace(/\s+/g, ' ').trim().slice(0, 200) : '';
}

function extractMetaDescription(raw) {
  const m = raw.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
    || raw.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  return m ? decodeEntities(m[1]).trim().slice(0, 300) : '';
}

function extractLinks(raw, baseUrl) {
  const links = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const href = m[1].trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;
    try {
      const abs = new URL(href, baseUrl).href;
      // 仅保留 http(s)
      if (!/^https?:/i.test(abs)) continue;
      links.push(abs);
    } catch { /* 忽略非法 URL */ }
  }
  return links;
}

// 提取正文纯文本：去掉 script/style/nav 等噪音，保留 main/article/body 文本
function extractText(raw) {
  let html = raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  html = decodeEntities(html)
    .replace(/[\t\r]+/g, ' ')
    .replace(/[ \u00A0]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n');
  return html.slice(0, 6000).trim();
}

// 中文分词：英文按单词，中文按双字 bigram（演示级搜索引擎足够）
function tokenize(text) {
  const tokens = [];
  const en = String(text || '').toLowerCase().match(/[a-z0-9][a-z0-9.\-]{1,31}/g) || [];
  tokens.push(...en.map((w) => w.toLowerCase()));
  const zh = String(text || '').replace(/[^\u4e00-\u9fa5]/g, '');
  for (let i = 0; i < zh.length - 1; i++) {
    tokens.push(zh.slice(i, i + 2));
  }
  return tokens;
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(d));
}

module.exports = { extractTitle, extractMetaDescription, extractLinks, extractText, tokenize, decodeEntities };
