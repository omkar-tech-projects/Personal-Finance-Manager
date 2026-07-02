/* portfolio.js — Portfolio list, view, delete */

let portfoliosCache = [];
let showDeleted = false;

async function loadPortfoliosPage(deleted = false) {
  showDeleted = deleted;
  document.getElementById('portfolioPageTitle').innerHTML =
    deleted ? '<i class="fas fa-trash-alt"></i> Deleted Portfolios'
            : '<i class="fas fa-briefcase"></i> My Portfolios';
  const grid = document.getElementById('portfolioGrid');
  grid.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3);"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
  try {
    portfoliosCache = await API.getPortfolios();
    renderPortfolioGrid(deleted);
    updateDropdownPortfolios();
  } catch(e) {
    grid.innerHTML = '<div class="port-empty"><i class="fas fa-exclamation-triangle"></i><p>Failed to load portfolios</p></div>';
  }
}

function renderPortfolioGrid(deleted) {
  const grid = document.getElementById('portfolioGrid');
  const list = portfoliosCache.filter(p => !!p.deleted === deleted);
  if (list.length === 0) {
    grid.innerHTML = `<div class="port-empty" style="grid-column:1/-1">
      <i class="fas fa-folder-open"></i>
      <p>${deleted ? 'No deleted portfolios.' : 'No portfolios yet. Create your first FIRE plan!'}</p>
      ${!deleted ? '<button class="btn-primary" onclick="navigate(\'portmaker\')"><i class="fas fa-plus"></i> Create Portfolio</button>' : ''}
    </div>`;
    return;
  }
  grid.innerHTML = list.map(p => {
    const r = p.calc_result || {};
    const fire = r.fire_goal || 0;
    const curr = r.total_assets || 0;
    const proj = r.projected_value || 0;
    const goal = r.inflation_adj_goal || fire;
    const pct = goal > 0 ? Math.min(100, Math.round(proj / goal * 100)) : 0;
    const onTrack = r.can_retire;
    return `
    <div class="port-card ${p.deleted ? 'deleted' : ''}" onclick="viewPortfolioResult('${p.id}')">
      <div class="port-card-name">${escHtml(p.name)}</div>
      <div class="port-card-date"><i class="fas fa-calendar-alt"></i> ${new Date(p.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div>
      <div class="port-stats-grid">
        <div class="psg-item"><div class="psg-label">FIRE Goal</div><div class="psg-value">${fmtMoney(fire)}</div></div>
        <div class="psg-item"><div class="psg-label">Current Assets</div><div class="psg-value">${fmtMoney(curr)}</div></div>
        <div class="psg-item"><div class="psg-label">Projected</div><div class="psg-value ${onTrack ? 'green':'red'}">${fmtMoney(proj)}</div></div>
        <div class="psg-item"><div class="psg-label">Status</div><div class="psg-value"><span class="badge ${onTrack ? 'badge-green':'badge-red'}">${onTrack ? '✓ On Track':'⚠ Gap'}</span></div></div>
      </div>
      <div class="port-card-footer">
        <div class="port-prog"><div class="port-prog-fill ${onTrack ? '' : 'red'}" style="width:${pct}%"></div></div>
        <span class="port-prog-pct">${pct}%</span>
        <div onclick="event.stopPropagation()" style="display:flex;gap:6px;margin-left:8px;">
          ${p.deleted
            ? `<button class="btn-secondary" style="padding:6px 12px;font-size:.75rem;" onclick="restorePort('${p.id}')"><i class="fas fa-undo"></i></button>`
            : `<button class="btn-danger-sm" onclick="deletePort('${p.id}')"><i class="fas fa-trash"></i></button>`
          }
        </div>
      </div>
    </div>`;
  }).join('');
}

async function deletePort(id) {
  if (!confirm('Move this portfolio to deleted?')) return;
  try {
    await API.deletePortfolio(id);
    portfoliosCache = await API.getPortfolios();
    renderPortfolioGrid(showDeleted);
    updateDropdownPortfolios();
    toast('Portfolio deleted', 'info');
  } catch(e) { toast(e.message, 'error'); }
}

async function restorePort(id) {
  try {
    await API.restorePortfolio(id);
    portfoliosCache = await API.getPortfolios();
    renderPortfolioGrid(showDeleted);
    updateDropdownPortfolios();
    toast('Portfolio restored! ✅', 'success');
  } catch(e) { toast(e.message, 'error'); }
}

function viewPortfolioResult(id) {
  const p = portfoliosCache.find(x => x.id === id);
  if (!p || !p.calc_result) return;
  window._activeResult = p.calc_result;
  window._activePortName = p.name;
  renderResultsPage(p.calc_result, p.name);
  navigate('results');
}

function updateDropdownPortfolios() {
  const el = document.getElementById('ddActivePortfolios');
  if (!el) return;
  const active = portfoliosCache.filter(p => !p.deleted).slice(0, 5);
  if (active.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = '<div class="dd-divider"></div>' +
    active.map(p => `<a class="dd-item" onclick="viewPortfolioResult('${p.id}')"><i class="fas fa-folder-open"></i> ${escHtml(p.name.slice(0,22))}</a>`).join('');
}
