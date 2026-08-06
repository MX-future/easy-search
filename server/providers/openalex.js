// OpenAlex API：全球学术文献库（免费无 key，数据覆盖 arXiv/PubMed/Crossref 等）
const { fetchJson } = require('./_http');

async function search(query, limit = 8) {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${limit}&select=id,title,publication_year,doi,type,primary_location,cited_by_count,abstract_inverted_index`;
  const data = await fetchJson(url, { timeoutMs: 9000 });
  const results = (data.results || []).map((r) => {
    const year = r.publication_year || '';
    const journal = r.primary_location?.source?.display_name || '';
    const abstract = reconstructAbstract(r.abstract_inverted_index) || '';
    const doiUrl = r.doi || `https://openalex.org/${r.id.split('/').pop()}`;
    return {
      id: `openalex-${r.id}`,
      title: r.title || '未命名文献',
      type: 'paper',
      source: 'OpenAlex 学术',
      url: doiUrl,
      desc: truncate(abstract, 220) || `发表于 ${year}${journal ? ' · ' + journal : ''}，OpenAlex 收录`,
      meta: [year, journal || '学术文献', `被引 ${r.cited_by_count ?? 0}`].filter(Boolean).join(' · '),
      image: null,
      extra: { doi: r.doi || '', type: r.type },
    };
  });
  return results;
}

// OpenAlex 摘要以倒排索引存储，重建为文本
function reconstructAbstract(inverted) {
  if (!inverted) return '';
  const words = [];
  for (const [word, positions] of Object.entries(inverted)) {
    for (const pos of positions) words[pos] = word;
  }
  return words.filter((w) => w !== undefined).join(' ');
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

module.exports = { search, name: 'OpenAlex 学术' };
