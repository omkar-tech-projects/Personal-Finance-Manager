/* markets.js — Market data via backend /api/markets + /api/chart */

const MARKETS = (() => {
  let cached = {};
  let lastFetchTime = 0;
  const CACHE_TTL = 90000;

  async function fetchAll() {
    const now = Date.now();
    if (now - lastFetchTime < CACHE_TTL && Object.keys(cached).length > 5) return cached;
    try {
      const r = await fetch('/api/markets', { signal: AbortSignal.timeout(15000) });
      const json = await r.json();
      const result = {};
      (json.data || []).forEach(d => {
        result[d.symbol] = {
          symbol: d.symbol, name: d.name, flag: d.flag, cat: d.category,
          price: d.price, change: d.change, changePct: d.change_pct,
          prevClose: d.prev_close, live: d.live,
        };
      });
      if (Object.keys(result).length > 0) {
        cached = result;
        lastFetchTime = now;
      }
      return result;
    } catch(e) {
      console.error('Markets fetch error:', e);
      return cached;
    }
  }

  function formatPrice(price, symbol) {
    if (!price || price === 0) return '—';
    if (symbol === 'INR=X') return price.toFixed(2);
    if (['SI=F','GC=F','CL=F'].includes(symbol)) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (symbol?.endsWith('-USD') && price < 10) return '$' + price.toFixed(4);
    if (symbol?.endsWith('-USD')) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price > 10000) return price.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function changeClass(pct) { return pct > 0 ? 'up' : pct < 0 ? 'dn' : 'flat'; }
  function changeArrow(pct) { return pct > 0 ? '▲' : pct < 0 ? '▼' : '—'; }
  function clearCache() { lastFetchTime = 0; }

  const SYMBOLS = [
    {sym:'^BSESN',cat:'india'},{sym:'^NSEI',cat:'india'},{sym:'^NSEBANK',cat:'india'},{sym:'^CNXIT',cat:'india'},
    {sym:'^GSPC',cat:'us'},{sym:'^IXIC',cat:'us'},{sym:'^DJI',cat:'us'},{sym:'^RUT',cat:'us'},
    {sym:'^N225',cat:'global'},{sym:'^FTSE',cat:'global'},{sym:'^GDAXI',cat:'global'},{sym:'^HSI',cat:'global'},{sym:'^AXJO',cat:'global'},{sym:'^STOXX50E',cat:'global'},
    {sym:'GC=F',cat:'commodity'},{sym:'SI=F',cat:'commodity'},{sym:'CL=F',cat:'commodity'},{sym:'INR=X',cat:'commodity'},
    {sym:'BTC-USD',cat:'crypto'},{sym:'ETH-USD',cat:'crypto'},{sym:'SOL-USD',cat:'crypto'},{sym:'BNB-USD',cat:'crypto'},{sym:'XRP-USD',cat:'crypto'},
  ];

  return { fetchAll, clearCache, SYMBOLS, formatPrice, changeClass, changeArrow };
})();

// ── Home market row ──────────────────────────────────────────────────
async function loadHomeMarkets() {
  const el = document.getElementById('homeMarketsRow');
  if (!el) return;
  el.innerHTML = '<div class="market-skeleton"></div>'.repeat(8);
  try {
    const data = await MARKETS.fetchAll();
    const show = ['^BSESN', '^NSEI', '^NSEBANK', '^GSPC', '^IXIC', '^DJI', '^N225', 'BTC-USD'];
    el.innerHTML = show.map(sym => {
      const d = data[sym];
      if (!d) return '';
      const cls = MARKETS.changeClass(d.changePct);
      const noData = !d.price || d.price === 0;
      return `<div class="market-card">
        <div class="mc-flag">${d.flag}</div>
        <div class="mc-name">${d.name}</div>
        <div class="mc-value">${noData ? '—' : MARKETS.formatPrice(d.price, sym)}</div>
        <div class="mc-change ${cls}">${noData ? '—' : `${MARKETS.changeArrow(d.changePct)} ${Math.abs(d.changePct).toFixed(2)}%`}</div>
      </div>`;
    }).join('');
    updateTicker(data);
  } catch(e) {
    el.innerHTML = '<div style="color:var(--text3);font-size:.8rem;padding:12px;">Market data unavailable.</div>';
  }
}

// ── Full markets page ────────────────────────────────────────────────
let currentMarketFilter = 'all';

async function loadMarketsPage() {
  await renderMarketsGrid(currentMarketFilter);
  renderIndexCharts('3m');
  document.getElementById('mktUpdateTime').textContent = new Date().toLocaleTimeString('en-IN');
}

async function filterMarkets(cat, btn) {
  currentMarketFilter = cat;
  document.querySelectorAll('.mkt-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  await renderMarketsGrid(cat);
}

async function renderMarketsGrid(filter) {
  const el = document.getElementById('marketsFullGrid');
  if (!el) return;
  el.innerHTML = '<div class="market-skeleton" style="height:100px"></div>'.repeat(10);
  const data = await MARKETS.fetchAll();
  const all = MARKETS.SYMBOLS;
  const filtered = filter === 'all' ? all : all.filter(s => s.cat === filter);
  el.innerHTML = filtered.map(s => {
    const d = data[s.sym];
    if (!d) return '';
    const cls = MARKETS.changeClass(d.changePct);
    const noData = !d.price || d.price === 0;
    return `<div class="market-card-big">
      <div class="mcb-header">
        <div class="mcb-name">${d.flag} ${d.name}</div>
        <div class="mcb-cat">${(s.cat || '').toUpperCase()}</div>
      </div>
      <div class="mcb-value ${cls}">${noData ? 'No data' : MARKETS.formatPrice(d.price, s.sym)}</div>
      <div class="mcb-change ${cls}">
        ${noData ? '<span style="color:var(--text3);font-size:.7rem">Fetching…</span>' : `${MARKETS.changeArrow(d.changePct)} ${Math.abs(d.change).toFixed(2)} (${Math.abs(d.changePct).toFixed(2)}%)`}
      </div>
    </div>`;
  }).join('');
}

async function refreshMarkets() {
  MARKETS.clearCache();
  await loadMarketsPage();
  toast('Markets refreshed! 🔄', 'success');
}

// ── Ticker ───────────────────────────────────────────────────────────
function updateTicker(data) {
  const el = document.getElementById('tickerContent');
  if (!el) return;
  const show = ['^BSESN','^NSEI','^NSEBANK','^GSPC','^IXIC','GC=F','CL=F','BTC-USD','ETH-USD','INR=X'];
  const items = show.map(sym => {
    const d = data[sym];
    if (!d || !d.price) return '';
    const cls = MARKETS.changeClass(d.changePct);
    const cssClass = cls === 'up' ? 'tick-up' : cls === 'dn' ? 'tick-dn' : 'tick-neutral';
    return `<span class="tick-item">${d.flag} ${d.name} <span class="${cssClass}">${MARKETS.changeArrow(d.changePct)} ${MARKETS.formatPrice(d.price, sym)} (${Math.abs(d.changePct).toFixed(2)}%)</span></span>`;
  }).filter(Boolean);
  el.innerHTML = items.length ? [...items, ...items].join('') : 'Fetching live data…';
}

// ── Index Charts via backend /api/chart ──────────────────────────────
const PERIOD_MAP = { '3m': '3mo', '6m': '6mo', '1y': '1y', '3y': '3y', '5y': '5y' };

async function changeChartRange(index, range, btn) {
  const card = btn.closest('.card');
  card.querySelectorAll('.crb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const sym = index === 'nifty' ? '^NSEI' : '^GSPC';
  const color = index === 'nifty' ? '#00c97a' : '#3b82f6';
  const canvasId = index === 'nifty' ? 'niftyChart' : 'spChart';
  const label = index === 'nifty' ? 'NIFTY 50' : 'S&P 500';
  await fetchAndRenderChart(canvasId, sym, label, color, PERIOD_MAP[range] || '3mo');
}

async function renderIndexCharts(range) {
  const period = PERIOD_MAP[range] || '3mo';
  await Promise.all([
    fetchAndRenderChart('niftyChart', '^NSEI', 'NIFTY 50', '#00c97a', period),
    fetchAndRenderChart('spChart', '^GSPC', 'S&P 500', '#3b82f6', period),
  ]);
}

async function fetchAndRenderChart(canvasId, symbol, label, color, period) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  // Show loading
  if (ctx._chart) ctx._chart.destroy();

  try {
    const r = await fetch(`/api/chart/${encodeURIComponent(symbol)}?period=${period}`, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error('API error');
    const json = await r.json();
    const chartData = json.data || [];
    if (chartData.length === 0) throw new Error('No data');

    const labels = chartData.map(d => d.date);
    const values = chartData.map(d => d.close);

    // Thin out labels for readability
    const maxLabels = 8;
    const step = Math.max(1, Math.floor(labels.length / maxLabels));
    const sparseLabels = labels.map((l, i) => i % step === 0 ? l : '');

    renderTrendChart(canvasId, label, { labels: sparseLabels, data: values }, color);
  } catch(e) {
    // Fallback to generated trend
    const bases = { '^NSEI': 22500, '^GSPC': 5700 };
    const base = bases[symbol] || 100;
    const trend = generateFallbackTrend(base, period);
    renderTrendChart(canvasId, label + ' (est.)', trend, color);
  }
}

function generateFallbackTrend(endPrice, period) {
  const dayMap = { '3mo': 90, '6mo': 180, '1y': 365, '3y': 1095, '5y': 1825 };
  const days = dayMap[period] || 90;
  const prices = [endPrice];
  for (let i = 1; i <= days; i++) {
    const prev = prices[prices.length - 1];
    prices.push(prev / (1 + (Math.random() - 0.49) * 0.015 + 0.0003));
  }
  prices.reverse();
  const labels = [], data = [];
  const today = new Date();
  const step = days <= 90 ? 15 : days <= 180 ? 30 : days <= 365 ? 60 : 180;
  let pi = 0;
  for (let i = days; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    labels.push(i % step === 0 ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '');
    data.push(prices[pi++] || endPrice);
  }
  return { labels, data };
}

function renderTrendChart(canvasId, label, { labels, data }, color) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (ctx._chart) ctx._chart.destroy();
  ctx._chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label, data, borderColor: color, backgroundColor: color + '18', fill: true, tension: 0.3, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index', intersect: false,
          callbacks: { label: ctx => ' ' + parseFloat(ctx.raw).toLocaleString('en-IN', { maximumFractionDigits: 2 }) }
        }
      },
      scales: {
        x: {
          ticks: {
            color: 'var(--text3)', font: { size: 10 },
            callback: function(val, i) {
              const lbl = this.getLabelForValue(i);
              return lbl || null;
            },
            maxRotation: 0,
            autoSkip: false,
          },
          grid: { display: false }
        },
        y: {
          ticks: { color: 'var(--text3)', font: { size: 10, family: 'DM Mono' }, callback: v => v.toLocaleString('en-IN', { maximumFractionDigits: 0 }) },
          grid: { color: 'var(--border2)' }
        }
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
  });
}
