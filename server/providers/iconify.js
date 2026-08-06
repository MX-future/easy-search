// Iconify API：海量开源 SVG 图标素材搜索（免费无 key）
// 面向设计师/开发者的图标素材，支持多种主流图标集
const { fetchJson } = require('./_http');

async function search(query, limit = 12) {
  const q = query.trim();
  if (!q) return [];
  const url = `https://api.iconify.design/search?query=${encodeURIComponent(q)}&limit=${limit}`;
  const data = await fetchJson(url, { timeoutMs: 9000 });
  const icons = data.icons || [];
  if (icons.length === 0) return [];

  // 批量获取图标元数据（含 SVG 路径）
  let meta = {};
  try {
    const metaUrl = `https://api.iconify.design/${icons.slice(0, limit).join(',')}.json?pretty=false`;
    meta = await fetchJson(metaUrl, { timeoutMs: 9000 });
  } catch { /* 元数据失败则仅用名字展示 */ }

  return icons.slice(0, limit).map((iconName, i) => {
    const [prefix, name] = iconName.split(':');
    const info = meta[iconName] || {};
    const svgUrl = `https://api.iconify.design/${iconName}.svg`;
    return {
      id: `iconify-${iconName}`,
      title: `${iconName} · SVG 图标`,
      type: 'image',
      source: 'Iconify 图标库',
      url: svgUrl,
      desc: `开源 SVG 图标，可免费商用 · 图标集：${prefix} · 尺寸可任意缩放`,
      meta: `${prefix} 图标集 · 免费可商用`,
      image: svgUrl,
      extra: { prefix, tags: info.tags ? info.tags.slice(0, 6) : [] },
    };
  });
}

module.exports = { search, name: 'Iconify 图标库' };
