// iTunes Search API：正版影视 / 音乐 / 软件 / 电子书
// 官方渠道（iTunes Store / Apple TV / Apple Books），完全合规
const { fetchJson } = require('./_http');

const MEDIA_MAP = {
  movie: 'video',      // 影视
  tvShow: 'video',     // 影视（剧集）
  music: 'music',      // 音乐
  musicVideo: 'video', // 音乐视频
  software: 'software',// 软件/应用
  ebook: 'document',   // 电子书
  audiobook: 'document',
  podcast: 'audio',
};

const SOURCE_LABEL = {
  movie: 'Apple TV/iTunes 正版',
  tvShow: 'Apple TV/iTunes 正版',
  music: 'Apple Music/iTunes 正版',
  musicVideo: 'Apple TV 正版',
  software: 'App Store 正版',
  ebook: 'Apple Books 正版',
  audiobook: 'Apple Books 正版',
  podcast: 'Apple Podcasts 正版',
};

async function search(query, limit = 12, opts = {}) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=all&entity=movie,tvShow,musicTrack,software,ebook,audiobook,musicVideo&limit=${limit * 2}&country=cn`;
  const data = await fetchJson(url);
  const results = (data.results || []).map((r) => {
    const mediaType = r.kind && r.kind !== 'song' ? r.kind : r.wrapperType;
    const typeKey =
      mediaType === 'movie' ? 'movie' :
      mediaType === 'tv-episode' || mediaType === 'tvSeason' || mediaType === 'tvShow' ? 'tvShow' :
      mediaType === 'software' || r.wrapperType === 'software' ? 'software' :
      mediaType === 'ebook' ? 'ebook' :
      mediaType === 'audiobook' ? 'audiobook' :
      mediaType === 'music-video' ? 'musicVideo' :
      'music';

    const type = MEDIA_MAP[typeKey] || 'general';
    // 按路由类型过滤：影视分类只保留影视，音乐只保留音乐，软件只保留软件
    if (opts.type && !typeMatchesRoute(type, opts.type)) return null;
    const artist = r.artistName || r.collectionArtistName || '';
    const album = r.collectionName && r.collectionName !== r.trackName ? ` · ${r.collectionName}` : '';
    const year = r.releaseDate ? r.releaseDate.slice(0, 4) : '';
    const price = r.trackPrice != null ? `¥${r.trackPrice}` : (r.collectionPrice != null ? `¥${r.collectionPrice}` : '免费');

    const metaParts = [];
    if (year) metaParts.push(year);
    if (type === 'music' && artist) metaParts.push(artist);
    if (type === 'video' && artist) metaParts.push(artist);
    if (type === 'video' && r.contentAdvisoryRating) metaParts.push(r.contentAdvisoryRating);
    metaParts.push(price);

    return {
      id: `itunes-${r.trackId || r.collectionId}`,
      title: r.trackName || r.collectionName || r.trackCensoredName,
      type,
      source: SOURCE_LABEL[typeKey] || 'iTunes 正版',
      url: r.trackViewUrl || r.collectionViewUrl,
      desc: [r.longDescription || r.shortDescription || '', artist ? `作者/主演：${artist}${album}` : album].filter(Boolean).join('\n') || 'Apple 官方渠道收录的正版资源',
      meta: metaParts.join(' · ') || '正版渠道',
      image: (r.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
      extra: { kind: typeKey, genre: r.primaryGenreName || '' },
    };
  });
  return results.filter(Boolean);
}

// 路由类型 <-> iTunes 资源类型匹配
function typeMatchesRoute(type, route) {
  if (route === 'all' || route === 'document') {
    return route === 'document' ? type === 'document' : true;
  }
  return type === route;
}

module.exports = { search, name: 'iTunes 正版渠道' };
