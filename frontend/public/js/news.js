/* news.js — Live Financial News via RSS + Free APIs */

const NEWS = (() => {
  // Multiple proxies for reliability
  const PROXIES = [
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];

  const FEEDS = {
    india: [
      'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
      'https://economictimes.indiatimes.com/wealth/rssfeeds/837555174.cms',
      'https://www.business-standard.com/rss/markets-106.rss',
      'https://www.livemint.com/rss/markets',
    ],
    world: [
      'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
      'https://finance.yahoo.com/news/rssindex',
      'https://www.investing.com/rss/news.rss',
      'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    ],
    crypto: [
      'https://cointelegraph.com/rss',
      'https://coindesk.com/arc/outboundfeeds/rss/',
      'https://decrypt.co/feed',
    ],
  };

  async function fetchFeedWithProxy(feedUrl) {
    for (const makeProxy of PROXIES) {
      try {
        const proxyUrl = makeProxy(feedUrl);
        const r = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
        if (!r.ok) continue;
        const text = await r.text();
        if (!text || text.length < 100) continue;
        const items = parseRSS(text, feedUrl);
        if (items.length > 0) return items;
      } catch { continue; }
    }
    return [];
  }

  function parseRSS(xmlText, sourceUrl) {
    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlText, 'text/xml');
      const items = xml.querySelectorAll('item');
      if (!items.length) return [];

      const source = new URL(sourceUrl).hostname
        .replace('www.','').replace('feeds.','').replace('feed.','')
        .split('.')[0];

      return Array.from(items).slice(0, 8).map(item => {
        const title = (item.querySelector('title')?.textContent || '')
          .replace(/<!\[CDATA\[|\]\]>/g,'').replace(/<[^>]+>/g,'').trim();
        const link = item.querySelector('link')?.textContent?.trim()
          || item.querySelector('link')?.getAttribute('href')?.trim()
          || '#';
        const pubDate = item.querySelector('pubDate')?.textContent
          || item.querySelector('published')?.textContent || '';
        const desc = (item.querySelector('description')?.textContent || '')
          .replace(/<!\[CDATA\[|\]\]>/g,'').replace(/<[^>]+>/g,'').trim().slice(0,160);

        return title ? { title, link, pubDate, description: desc, source } : null;
      }).filter(Boolean);
    } catch { return []; }
  }

  async function getNews(category) {
    const feedUrls = FEEDS[category] || FEEDS.india;
    // Try feeds in parallel, use first 2 that work
    const allResults = await Promise.allSettled(
      feedUrls.slice(0, 3).map(url => fetchFeedWithProxy(url))
    );
    const items = allResults
      .flatMap(r => r.status === 'fulfilled' ? r.value : []);

    // Deduplicate
    const seen = new Set();
    const unique = items.filter(i => {
      if (!i.title || seen.has(i.title)) return false;
      seen.add(i.title);
      return true;
    });

    // Sort newest first
    return unique.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)).slice(0, 14);
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    try {
      const diff = (Date.now() - new Date(dateStr)) / 1000;
      if (diff < 60) return 'just now';
      if (diff < 3600) return Math.floor(diff/60) + 'm ago';
      if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
      if (diff < 604800) return Math.floor(diff/86400) + 'd ago';
      return new Date(dateStr).toLocaleDateString('en-IN', { day:'2-digit', month:'short' });
    } catch { return ''; }
  }

  return { getNews, timeAgo };
})();

let currentNewsCategory = 'india';

async function loadNews(cat, tabEl) {
  currentNewsCategory = cat;
  if (tabEl) {
    document.querySelectorAll('.news-tab').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');
  }
  const el = document.getElementById('newsFeed');
  if (!el) return;

  el.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text3);">
    <i class="fas fa-circle-notch fa-spin" style="font-size:1.5rem;margin-bottom:10px;display:block;color:var(--emerald2)"></i>
    Fetching live news…
  </div>`;

  try {
    const items = await NEWS.getNews(cat);

    if (items.length === 0) {
      el.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text3);">
        <i class="fas fa-newspaper" style="font-size:2rem;margin-bottom:10px;display:block;opacity:.3"></i>
        <p>Could not fetch news right now.</p>
        <p style="font-size:.75rem;margin-top:6px;">CORS restrictions may block RSS feeds in local mode.<br>
        Try running the Python backend for full functionality.</p>
        <button onclick="loadNews('${cat}')" style="margin-top:12px;padding:8px 16px;background:var(--emerald);color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
          Retry
        </button>
      </div>`;
      return;
    }

    el.innerHTML = items.map(n => `
      <a class="news-item" href="${n.link}" target="_blank" rel="noopener noreferrer">
        <div class="news-indicator"></div>
        <div class="news-body">
          <div class="news-title">${escHtml(n.title)}</div>
          <div class="news-meta">
            <span class="news-source">${n.source || 'Finance'}</span>
            <span>${NEWS.timeAgo(n.pubDate)}</span>
            ${n.description ? `<span style="display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;">${escHtml(n.description.slice(0,80))}…</span>` : ''}
          </div>
        </div>
        <i class="fas fa-external-link-alt news-ext-icon"></i>
      </a>
    `).join('');
  } catch(e) {
    el.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text3);">
      Failed to load news. Check your connection.
    </div>`;
  }
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&amp;/g,'&')
    .replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'")
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
