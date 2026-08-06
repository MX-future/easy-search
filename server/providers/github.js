// GitHub API：开源软件 / 工具 / 项目
const config = require('../config');
const { fetchJson } = require('./_http');

async function search(query, limit = 10) {
  const headers = {};
  if (config.githubToken) headers.Authorization = `Bearer ${config.githubToken}`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`;
  // 无 token 时偶发 403（并发限流），退避重试一次
  let data;
  try {
    data = await fetchJson(url, { headers });
  } catch (e) {
    if (/HTTP 403/.test(e.message)) {
      await new Promise((r) => setTimeout(r, 3000));
      data = await fetchJson(url, { headers });
    } else {
      throw e;
    }
  }
  const results = (data.items || []).map((r) => ({
    id: `gh-${r.id}`,
    title: r.full_name,
    type: 'software',
    source: 'GitHub 开源',
    url: r.html_url,
    desc: r.description || '（暂无描述）',
    meta: [`★ ${formatNum(r.stargazers_count)}`, r.language || '未知语言', r.license ? r.license.spdx_id : '无许可证'].filter(Boolean).join(' · '),
    image: r.owner && r.owner.avatar_url ? r.owner.avatar_url : null,
    extra: { forks: r.forks_count, topics: (r.topics || []).slice(0, 5) },
  }));
  return results;
}

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

module.exports = { search, name: 'GitHub 开源' };
