// 前端逻辑：搜索 + 分类过滤 + 卡片渲染
(() => {
  const $ = (sel) => document.querySelector(sel);
  const form = $('#searchForm');
  const input = $('#searchInput');
  const btn = $('#searchBtn');
  const chipsBox = $('#typeChips');
  const resultsEl = $('#results');
  const loadingEl = $('#loading');
  const emptyEl = $('#empty');
  const statsBar = $('#statsBar');
  const statsText = $('#statsText');
  const providersState = $('#providersState');

  const ICONS = {
    software: '💻', video: '🎬', music: '🎵',
    paper: '📄', image: '🖼️', document: '📚', general: '🔗',
  };
  const TYPE_NAMES = {
    software: '软件/工具', video: '影视', music: '音乐',
    paper: '学术论文', image: '图片素材', document: '百科/文档', general: '其他',
  };

  let allResults = [];
  let activeType = 'all';
  let lastQuery = '';

  // ---------- 搜索 ----------
  async function doSearch(q) {
    if (!q) return;
    lastQuery = q;
    setLoading(true);
    resultsEl.innerHTML = '';
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=all&limit=14`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      allResults = data.results || [];
      renderProviders(data.providers || [], data.errors || []);
      renderStats(data.total, q, data.errors || []);
      renderByType();
    } catch (e) {
      allResults = [];
      statsBar.classList.add('hidden');
      providersState.innerHTML = '';
      emptyEl.classList.remove('hidden');
      emptyEl.querySelector('.empty-title').textContent = '搜索失败';
      emptyEl.querySelector('.empty-desc').textContent = `服务异常：${e.message}，请确认后端服务已启动`;
    } finally {
      setLoading(false);
    }
  }

  // ---------- 分类过滤 ----------
  function renderByType() {
    const list = activeType === 'all' ? allResults : allResults.filter((r) => r.type === activeType);
    if (list.length === 0) {
      resultsEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
      emptyEl.querySelector('.empty-title').textContent = '该分类下暂无结果';
      emptyEl.querySelector('.empty-desc').textContent = `换一个资源类型，或搜索"${lastQuery}"的其他关键词`;
      return;
    }
    emptyEl.classList.add('hidden');
    resultsEl.innerHTML = list.map(cardHTML).join('');
  }

  // ---------- 渲染 ----------
  function renderStats(total, q, errors) {
    statsBar.classList.remove('hidden');
    statsText.innerHTML = `“<b>${escapeHtml(q)}</b>” 共找到 <b>${total}</b> 条资源`;
  }

  function renderProviders(providers, errors) {
    const errMap = {};
    errors.forEach((e) => { errMap[e.provider] = e.message; });
    providersState.innerHTML = providers
      .map((p) => {
        const failed = errMap[p.name];
        return `<span class="pv-tag ${failed ? 'fail' : 'ok'}">${failed ? '⚠️' : '✓'} ${p.label}</span>`;
      })
      .join('');
  }

  function cardHTML(r) {
    const icon = ICONS[r.type] || '🔗';
    const cover = r.image
      ? `<img src="${escapeAttr(r.image)}" loading="lazy" alt="" onerror="this.parentElement.innerHTML='<div class=\\'fallback\\'>${icon}</div>'" />`
      : `<div class="fallback">${icon}</div>`;
    const imgCls = r.type === 'image' ? 'card-image' : '';

    // 图片类卡片特殊布局
    if (r.type === 'image') {
      return `
      <a class="card card-image" href="${escapeAttr(r.url)}" target="_blank" rel="noopener noreferrer">
        <div class="card-cover">${cover}</div>
        <div class="card-body">
          <div class="card-title">${escapeHtml(r.title)}</div>
          <div class="card-desc">${escapeHtml(r.desc || '')}</div>
          <div class="card-meta">
            <span class="meta-left">${escapeHtml(r.meta || '')}</span>
            <span class="card-source">${escapeHtml(r.source || '')}</span>
          </div>
        </div>
      </a>`;
    }

    return `
    <a class="card" href="${escapeAttr(r.url)}" target="_blank" rel="noopener noreferrer">
      <div class="card-cover">${cover}</div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(r.title)}</div>
        <div class="card-desc">${escapeHtml(r.desc || '')}</div>
        <div class="card-meta">
          <span class="meta-left">${escapeHtml(r.meta || '')}</span>
          <span class="card-source">${escapeHtml(r.source || '')}</span>
        </div>
      </div>
    </a>`;
  }

  // ---------- 工具 ----------
  function setLoading(on) {
    loadingEl.classList.toggle('hidden', !on);
    btn.disabled = on;
    btn.textContent = on ? '搜索中…' : '搜索';
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ---------- 事件 ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    doSearch(input.value.trim());
  });

  chipsBox.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    activeType = chip.dataset.type;
    if (allResults.length > 0) renderByType();
    else doSearch(input.value.trim());
  });

  // 回车即搜 / 首次加载自动搜索默认词
  doSearch(input.value.trim());
})();
