// robots.txt 解析器：遵守站点的抓取规则（标准实现，支持 User-agent 分段与 Disallow 前缀匹配）
const config = require('./config');

class Robots {
  constructor() {
    this.rules = []; // [{ ua: 'ResourceCrawler' | '*', disallows: [prefix], allows: [] }]
    this.loaded = false;
  }

  // 从文本解析 robots.txt
  parse(text) {
    this.rules = [];
    let current = null;
    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const field = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();
      if (field === 'user-agent') {
        current = { ua: value.toLowerCase(), disallows: [], allows: [] };
        this.rules.push(current);
      } else if (field === 'disallow' && current) {
        if (value) current.disallows.push(value); // 空 Disallow 表示允许
      } else if (field === 'allow' && current) {
        if (value) current.allows.push(value);
      }
    }
    this.loaded = true;
  }

  // 判断某路径是否允许抓取
  isAllowed(pathname) {
    if (!this.loaded) return true;
    const groups = this.rules.filter((r) => r.ua === config.USER_AGENT.split('/')[0].toLowerCase() || r.ua === '*');
    for (const g of groups) {
      if (g.allows.some((p) => p !== '' && pathname.startsWith(p))) return true;
      if (g.disallows.some((p) => pathname.startsWith(p))) return false;
    }
    return true;
  }
}

module.exports = Robots;
