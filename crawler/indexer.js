// 索引器：构建倒排索引并查询（TF 相关度 + 标题加权）
const parser = require('./parser');

// 构建索引：doc = { url, title, desc, text }
function buildIndex(docs) {
  const terms = {}; // term -> { df, postings: {docId: tf} }
  const index = { docs: docs.map((d) => ({ url: d.url, title: d.title, desc: d.desc || '' })), terms: {} };

  docs.forEach((doc, docId) => {
    const titleTokens = parser.tokenize(doc.title);
    const bodyTokens = parser.tokenize(doc.text);
    // 词频统计，标题命中加权 ×3
    const tf = {};
    for (const t of titleTokens) tf[t] = (tf[t] || 0) + 3;
    for (const t of bodyTokens) tf[t] = (tf[t] || 0) + 1;

    for (const [term, count] of Object.entries(tf)) {
      if (!index.terms[term]) index.terms[term] = { df: 0, postings: {} };
      index.terms[term].df += 1;
      index.terms[term].postings[docId] = count;
    }
  });
  return index;
}

// 查询：返回 [{ url, title, score }]
function searchIndex(index, query, limit = 8) {
  if (!index || !index.terms) return [];
  const tokens = parser.tokenize(query);
  if (tokens.length === 0) return [];

  const scores = {};
  for (const term of tokens) {
    const entry = index.terms[term];
    if (!entry) continue;
    // idf 权重：出现越少越重要（平滑）
    const idf = Math.log((index.docs.length + 1) / (entry.df + 0.5));
    for (const [docId, tf] of Object.entries(entry.postings)) {
      scores[docId] = (scores[docId] || 0) + tf * idf;
    }
  }

  return Object.entries(scores)
    .map(([docId, score]) => ({ docId: Number(docId), score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ docId, score }) => {
      const doc = index.docs[docId];
      return {
        url: doc.url,
        title: doc.title || doc.url,
        desc: doc.desc || '',
        score: Math.round(score * 100) / 100,
      };
    });
}

module.exports = { buildIndex, searchIndex };
