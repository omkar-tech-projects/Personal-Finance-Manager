/* liabilities.js — Future Liabilities Planner — Multi-item support */

const LIAB_DEFS = [
  { id: 'car',       emoji: '🚗', color: '#00c97a', title: 'Car / Vehicle',       subtitle: 'Car, SUV, EV — add as many as you plan',
    fields: [
      { id: 'name',      label: 'Car Model',                 ph: 'e.g. Tata Nexon EV' },
      { id: 'by_age',    label: 'By What Age?',              ph: 'e.g. 32' },
      { id: 'cost',      label: 'Expected Cost (₹)',         ph: 'e.g. 1500000' },
      { id: 'loan_rate', label: 'Loan Interest Rate (%)',    ph: 'e.g. 8.5' },
    ]
  },
  { id: 'house',     emoji: '🏠', color: '#3b82f6', title: 'House / Property',    subtitle: 'Home, flat, plot — add each separately',
    fields: [
      { id: 'name',      label: 'Location / Type',           ph: 'e.g. 3BHK Bangalore' },
      { id: 'by_age',    label: 'By What Age?',              ph: 'e.g. 35' },
      { id: 'cost',      label: 'Expected Cost (₹)',         ph: 'e.g. 8000000' },
      { id: 'loan_rate', label: 'Home Loan Rate (%)',        ph: 'e.g. 8.5' },
    ]
  },
  { id: 'bike',      emoji: '🏍️', color: '#f97316', title: 'Bike / Two-Wheeler',  subtitle: 'Bike, scooter — add multiple',
    fields: [
      { id: 'name',      label: 'Bike Model',                ph: 'e.g. Royal Enfield Himalayan' },
      { id: 'by_age',    label: 'By What Age?',              ph: 'e.g. 28' },
      { id: 'cost',      label: 'Expected Cost (₹)',         ph: 'e.g. 400000' },
      { id: 'loan_rate', label: 'Loan Rate (%)',             ph: 'e.g. 10' },
    ]
  },
  { id: 'wedding',   emoji: '💍', color: '#8b5cf6', title: 'Wedding',             subtitle: 'Marriage expenses',
    fields: [
      { id: 'name',      label: 'Description',               ph: 'e.g. My wedding' },
      { id: 'by_age',    label: 'By What Age?',              ph: 'e.g. 30' },
      { id: 'cost',      label: 'Expected Cost (₹)',         ph: 'e.g. 2000000' },
    ]
  },
  { id: 'children',  emoji: '👶', color: '#ef4444', title: 'Children',            subtitle: 'Childbirth + education costs',
    fields: [
      { id: 'num_children',label: 'No. of Children',         ph: 'e.g. 2' },
      { id: 'by_age',    label: 'First Child By Age?',       ph: 'e.g. 30' },
      { id: 'birth_cost',label: 'Birth Cost Each (₹)',       ph: 'e.g. 200000' },
      { id: 'edu_cost',  label: 'Education Cost Each (₹)',   ph: 'e.g. 3000000' },
    ]
  },
  { id: 'education', emoji: '🎓', color: '#0ea5e9', title: 'Higher Education',    subtitle: 'MBA, masters, professional courses',
    fields: [
      { id: 'name',      label: 'Course / College',          ph: 'e.g. MBA from IIM' },
      { id: 'by_age',    label: 'By What Age?',              ph: 'e.g. 28' },
      { id: 'cost',      label: 'Expected Cost (₹)',         ph: 'e.g. 2500000' },
    ]
  },
  { id: 'travel',    emoji: '✈️', color: '#22c55e', title: 'Travel & Experiences', subtitle: 'World tours, bucket list trips',
    fields: [
      { id: 'name',      label: 'Destination / Plan',        ph: 'e.g. Europe + Japan' },
      { id: 'by_age',    label: 'By What Age?',              ph: 'e.g. 35' },
      { id: 'cost',      label: 'Total Cost (₹)',            ph: 'e.g. 1000000' },
    ]
  },
  { id: 'gadgets',   emoji: '💻', color: '#64748b', title: 'Gadgets & Lifestyle',  subtitle: 'Electronics, furniture, appliances',
    fields: [
      { id: 'name',      label: 'Description',               ph: 'e.g. MacBook, OLED TV' },
      { id: 'by_age',    label: 'By What Age?',              ph: 'e.g. 29' },
      { id: 'cost',      label: 'Total Cost (₹)',            ph: 'e.g. 500000' },
    ]
  },
  { id: 'other',     emoji: '🛒', color: '#4a6355', title: 'Other Expenses',       subtitle: 'Any other major future expense',
    fields: [
      { id: 'name',      label: 'Description',               ph: 'e.g. Medical fund' },
      { id: 'by_age',    label: 'By What Age?',              ph: 'e.g. 50' },
      { id: 'cost',      label: 'Total Cost (₹)',            ph: 'e.g. 2000000' },
    ]
  },
];

function initLiabilities() {
  const container = document.getElementById('liabContent');
  container.innerHTML = LIAB_DEFS.map(l => `
    <div class="liab-card">
      <div class="liab-hd">
        <div class="liab-emoji" style="background:${l.color}18;">${l.emoji}</div>
        <div class="liab-info">
          <h4>${l.title}</h4>
          <p>${l.subtitle}</p>
        </div>
        <div class="liab-na-toggle">
          <input type="checkbox" id="lna_${l.id}" onchange="toggleLiabNA('${l.id}')">
          <label for="lna_${l.id}">N/A</label>
        </div>
      </div>
      <div id="lf_${l.id}" class="liab-fields-wrap">
        <div id="liab_rows_${l.id}"></div>
        <button type="button" class="add-row-btn" onclick="addLiabRow('${l.id}')">
          <i class="fas fa-plus-circle"></i> Add ${l.title}
        </button>
      </div>
    </div>
  `).join('');

  // Add first row to each liability type
  LIAB_DEFS.forEach(l => addLiabRow(l.id));
}

function addLiabRow(liabId) {
  const liabDef = LIAB_DEFS.find(l => l.id === liabId);
  if (!liabDef) return;
  const container = document.getElementById('liab_rows_' + liabId);
  const idx = container.querySelectorAll('.dyn-row').length;
  const div = document.createElement('div');
  div.className = 'dyn-row';
  const label = idx === 0 ? '' : ` #${idx + 1}`;
  const isFirst = idx === 0;
  div.innerHTML = liabDef.fields.map(f => `
    <div class="form-field" style="margin:0">
      <label>${f.label}${label}</label>
      <input type="text" class="liab-field" data-field="${f.id}" placeholder="${f.ph}">
    </div>
  `).join('') + (isFirst ? '' : `
    <button type="button" class="rm-btn" onclick="this.closest('.dyn-row').remove()">
      <i class="fas fa-times"></i>
    </button>
  `);
  container.appendChild(div);
}

function toggleLiabNA(id) {
  const checked = document.getElementById('lna_' + id).checked;
  document.getElementById('lf_' + id)?.classList.toggle('na-disabled', checked);
}

function collectLiabilities() {
  const result = {};
  LIAB_DEFS.forEach(l => {
    const isNA = document.getElementById('lna_' + l.id)?.checked;
    if (isNA) { result[l.id] = [{ na: true }]; return; }
    const rows = document.querySelectorAll(`#liab_rows_${l.id} .dyn-row`);
    const items = Array.from(rows).map(row => {
      const obj = {};
      row.querySelectorAll('.liab-field').forEach(inp => { obj[inp.dataset.field] = inp.value; });
      return Object.values(obj).some(v => String(v).trim()) ? obj : null;
    }).filter(Boolean);
    result[l.id] = items;
  });
  return result;
}

async function calcFinal() {
  const fireResult = window._activeResult;
  if (!fireResult) { toast('No FIRE data. Please complete portfolio first.', 'error'); return; }

  const liabilities = collectLiabilities();
  const btn = document.querySelector('#liabPage .btn-primary');
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Calculating...';
  btn.disabled = true;

  try {
    const data = await API.calculateFinal({ fire_result: fireResult, liabilities });
    renderFinalResults(data, fireResult);
    navigate('final');
  } catch(e) {
    toast('Calculation failed: ' + e.message, 'error');
  } finally {
    btn.innerHTML = '<i class="fas fa-calculator"></i> Calculate Complete Plan';
    btn.disabled = false;
  }
}

function renderFinalResults(d, fireResult) {
  const container = document.getElementById('finalPage');
  const isGood = d.can_retire_with_liabilities;

  container.innerHTML = `
  <div class="results-hero ${isGood ? 'rh-success' : 'rh-warning'}">
    <div class="rh-mascot">${isGood ? '🏆' : '📋'}</div>
    <div class="rh-title">${isGood ? '🎊 Complete FIRE Plan — You\'re Set!' : '📊 Your Complete Financial Roadmap'}</div>
    <div class="rh-sub">${isGood ? 'Even after all future liabilities, your wealth plan is on track!' : 'Here\'s the complete picture with all your future expenses factored in.'}</div>
  </div>

  <div class="final-summary">
    <div class="fs-card fs-green"><div class="fs-label">Assets at Retirement</div><div class="fs-value">${fmtMoney(d.projected_value)} <button class="currency-convert-btn" onclick="openCurrencyConverter(${d.projected_value},'INR')">💱</button></div></div>
    <div class="fs-card fs-red"><div class="fs-label">Total Future Liabilities</div><div class="fs-value">${fmtMoney(d.total_liab_cost)} <button class="currency-convert-btn" onclick="openCurrencyConverter(${d.total_liab_cost},'INR')">💱</button></div></div>
    <div class="fs-card ${d.surplus_or_deficit >= 0 ? 'fs-green' : 'fs-red'}"><div class="fs-label">Net After Liabilities</div><div class="fs-value">${fmtMoney(d.net_after_liabilities)} <button class="currency-convert-btn" onclick="openCurrencyConverter(${Math.abs(d.net_after_liabilities)},'INR')">💱</button></div></div>
  </div>

  <div class="stats-grid">
    <div class="stat-card"><div class="stat-label">FIRE Corpus Required</div><div class="stat-value">${fmtMoney(d.fire_corpus)}</div></div>
    <div class="stat-card"><div class="stat-label">Adjusted Goal (w/ Liabilities)</div><div class="stat-value red">${fmtMoney(d.adjusted_fire_goal)}</div></div>
    ${!isGood ? `
    <div class="stat-card"><div class="stat-label">Additional Needed</div><div class="stat-value red">${fmtMoney(d.additional_needed)}</div></div>
    <div class="stat-card"><div class="stat-label">Total SIP Required</div><div class="stat-value gold">${fmtMoney(d.total_sip_needed)}/mo</div></div>
    ` : `
    <div class="stat-card"><div class="stat-label">Surplus After Everything</div><div class="stat-value">${fmtMoney(d.surplus_or_deficit)}</div></div>
    <div class="stat-card"><div class="stat-label">Financial Freedom Age</div><div class="stat-value blue">${fireResult.retire_age}</div></div>
    `}
  </div>

  <div class="results-grid-2">
    <div class="chart-card">
      <h4><i class="fas fa-chart-bar"></i> Assets vs Liabilities vs Goal</h4>
      <canvas id="finalBarChart" height="200"></canvas>
    </div>
    <div class="chart-card">
      <h4><i class="fas fa-chart-pie"></i> Liabilities Breakdown</h4>
      <canvas id="liabPieChart" height="200"></canvas>
    </div>
  </div>

  ${d.liab_breakdown.length > 0 ? `
  <div class="invest-schedule">
    <h4><i class="fas fa-list-alt"></i> Liabilities Detail</h4>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Category</th><th>Details</th><th>Base Cost</th><th>Future Value</th><th>By Age</th></tr></thead>
        <tbody>
          ${d.liab_breakdown.map(l => `
            <tr>
              <td>${l.icon} ${l.label}</td>
              <td style="color:var(--text2)">${escHtml(l.name || '—')}</td>
              <td>${fmtMoney(l.original_cost)}</td>
              <td style="color:var(--red)">${fmtMoney(l.future_cost)}</td>
              <td>${l.by_age}</td>
            </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr style="font-weight:700;border-top:2px solid var(--border)">
            <td colspan="3">Total (Future Value, Inflation-adjusted)</td>
            <td style="color:var(--red)">${fmtMoney(d.total_liab_cost)}</td><td>—</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>` : ''}

  <div class="advice-box">
    <div class="advice-icon">🧞</div>
    <div class="advice-text">
      <strong>Omkar & Genie\'s Final Verdict:</strong>
      <p>${isGood
        ? `Your assets will comfortably cover all goals. Projected ${fmtMoney(d.projected_value)} exceeds adjusted goal ${fmtMoney(d.adjusted_fire_goal)} by ${fmtMoney(d.surplus_or_deficit)}. You\'re on the path to true financial freedom! 🎉`
        : `You need ${fmtMoney(d.total_sip_needed)}/month total SIP to achieve FIRE and fund all liabilities. Consider increasing income, delaying some expenses, or pushing retirement age by 2–3 years.`}
      </p>
    </div>
  </div>

  <div class="results-actions">
    <button class="btn-primary" onclick="saveFinalSnapshot()"><i class="fas fa-save"></i> Save Complete Plan</button>
    <button class="btn-secondary" onclick="navigate('portmaker')"><i class="fas fa-plus"></i> New Portfolio</button>
    <button class="btn-secondary" onclick="navigate('portfolio')"><i class="fas fa-briefcase"></i> All Portfolios</button>
  </div>`;

  setTimeout(() => {
    const bCtx = document.getElementById('finalBarChart');
    if (bCtx) {
      if (bCtx._chart) bCtx._chart.destroy();
      bCtx._chart = new Chart(bCtx, {
        type: 'bar',
        data: {
          labels: ['Current Assets','Projected','Liabilities','Adjusted Goal','Net Worth'],
          datasets: [{
            data: [fireResult.total_assets, d.projected_value, d.total_liab_cost, d.adjusted_fire_goal, d.net_after_liabilities],
            backgroundColor: ['#00c97a','#22c55e','#ef4444','#f5c518','#3b82f6'],
            borderRadius: 8, borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + fmtMoneyFull(ctx.raw) } } },
          scales: {
            x: { ticks: { color: 'var(--text3)', font: { size: 9 } }, grid: { display: false } },
            y: { ticks: { color: 'var(--text3)', callback: v => fmtMoney(v) }, grid: { color: 'var(--border2)' } }
          }
        }
      });
    }
    const pCtx = document.getElementById('liabPieChart');
    if (pCtx && d.liab_breakdown.length > 0) {
      if (pCtx._chart) pCtx._chart.destroy();
      const cols = ['#00c97a','#3b82f6','#f97316','#8b5cf6','#ef4444','#0ea5e9','#22c55e','#64748b','#4a6355'];
      pCtx._chart = new Chart(pCtx, {
        type: 'doughnut',
        data: {
          labels: d.liab_breakdown.map(l => l.icon + ' ' + l.label),
          datasets: [{ data: d.liab_breakdown.map(l => l.future_cost), backgroundColor: cols, borderWidth: 3, borderColor: 'var(--surface)' }]
        },
        options: {
          cutout: '58%',
          plugins: { legend: { position: 'right', labels: { color: 'var(--text3)', font: { size: 10 }, padding: 8 } }, tooltip: { callbacks: { label: ctx => ' ' + fmtMoneyFull(ctx.raw) } } }
        }
      });
    }
  }, 80);
}

async function saveFinalSnapshot() {
  try {
    await API.saveHistory({ type: 'final', result: window._activeResult, name: window._activePortName, saved_at: new Date().toISOString() });
    toast('Complete plan saved! 🎉', 'success');
  } catch(e) { toast('Save failed: ' + e.message, 'error'); }
}
