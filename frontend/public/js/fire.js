/* fire.js — FIRE Wizard + Results */

const WIZARD_STEPS = [
  {
    id: 'basics', title: 'Your FIRE Goals', desc: 'Set your financial independence target and timeline',
    fields: [
      { id: 'port_name',   label: 'Portfolio Name',        type: 'text',   ph: 'e.g. My FIRE Plan 2040',         req: true },
      { id: 'fire_goal',   label: 'FIRE Corpus Target (₹)',type: 'number', ph: 'e.g. 50000000 (5 Crore)',         req: true, hint: 'Total corpus needed to retire and never work again' },
      { id: 'current_age', label: 'Your Current Age',       type: 'number', ph: 'e.g. 28',                         req: true },
      { id: 'retire_age',  label: 'Target Retirement Age',  type: 'number', ph: 'e.g. 45',                         req: true },
      { id: 'inflation',   label: 'Inflation Rate (%)',     type: 'number', ph: 'e.g. 6',                          req: true, hint: 'Typical India: 5–7%. Higher = safer estimate' },
    ]
  },
  {
    id: 'bank', title: 'Bank Savings', desc: 'Add all your savings & current account balances',
    dynamic: { label: 'Bank Account', fields: [
      { id: 'name',    label: 'Bank Name',     ph: 'e.g. HDFC Bank', type: 'text' },
      { id: 'balance', label: 'Balance (₹)',   ph: 'e.g. 200000',    type: 'number' },
    ]}
  },
  {
    id: 'stocks', title: 'Stock Portfolio', desc: 'Enter each stock holding separately',
    dynamic: { label: 'Stock', fields: [
      { id: 'name',     label: 'Company / Ticker',  ph: 'e.g. Reliance',  type: 'text' },
      { id: 'invested', label: 'Amount Invested (₹)', ph: 'e.g. 100000',  type: 'number' },
      { id: 'gain',     label: 'Current Gain/Loss %', ph: 'e.g. 18 or -5', type: 'number' },
    ]}
  },
  {
    id: 'fd', title: 'Fixed Deposits', desc: 'Add all FD investments with interest rates',
    dynamic: { label: 'FD', fields: [
      { id: 'name',      label: 'Bank / Institution', ph: 'e.g. SBI FD',    type: 'text' },
      { id: 'invested',  label: 'Principal (₹)',       ph: 'e.g. 500000',    type: 'number' },
      { id: 'rate',      label: 'Interest Rate (%)',   ph: 'e.g. 7.1',       type: 'number' },
    ]}
  },
  {
    id: 'etf', title: 'Mutual Funds & ETFs', desc: 'Include all mutual funds, index funds, ETFs',
    dynamic: { label: 'Fund', fields: [
      { id: 'name',     label: 'Fund Name',           ph: 'e.g. Nifty 50 Index', type: 'text' },
      { id: 'invested', label: 'Invested (₹)',         ph: 'e.g. 300000',         type: 'number' },
      { id: 'gain',     label: 'Gain/Loss %',          ph: 'e.g. 22',             type: 'number' },
    ]}
  },
  {
    id: 'gold', title: 'Gold Holdings', desc: 'Physical gold, SGBs, Gold ETFs',
    dynamic: { label: 'Gold', fields: [
      { id: 'name',     label: 'Type',            ph: 'e.g. SGB / Physical / ETF', type: 'text' },
      { id: 'invested', label: 'Amount (₹)',       ph: 'e.g. 200000',               type: 'number' },
      { id: 'gain',     label: 'Gain/Loss %',      ph: 'e.g. 12',                   type: 'number' },
    ]}
  },
  {
    id: 'silver', title: 'Silver Holdings', desc: 'Physical silver, Silver ETFs, e-Silver',
    dynamic: { label: 'Silver', fields: [
      { id: 'name',     label: 'Type',            ph: 'e.g. Silver ETF / Physical', type: 'text' },
      { id: 'invested', label: 'Amount (₹)',       ph: 'e.g. 80000',                type: 'number' },
      { id: 'gain',     label: 'Gain/Loss %',      ph: 'e.g. 8',                    type: 'number' },
    ]}
  },
  {
    id: 'property', title: 'Real Estate', desc: 'Residential, commercial, land — all property',
    dynamic: { label: 'Property', fields: [
      { id: 'name',     label: 'Property',         ph: 'e.g. 2BHK Pune',       type: 'text' },
      { id: 'invested', label: 'Purchase Value (₹)',ph: 'e.g. 8000000',         type: 'number' },
      { id: 'gain',     label: 'Appreciation %',   ph: 'e.g. 30 (since bought)', type: 'number' },
    ]}
  },
  {
    id: 'bonds', title: 'Bonds, PPF & NPS', desc: 'Fixed income instruments, provident funds',
    dynamic: { label: 'Bond/Fund', fields: [
      { id: 'name',     label: 'Scheme / Instrument', ph: 'e.g. PPF / NPS / Bonds', type: 'text' },
      { id: 'invested', label: 'Corpus / Amount (₹)',  ph: 'e.g. 1000000',            type: 'number' },
      { id: 'rate',     label: 'Annual Rate (%)',      ph: 'e.g. 7.1',                type: 'number' },
    ]}
  },
];

let wizCurrentStep = 0;
let wizFormData = {};
let wizAssets = {};

function initWizard() {
  wizCurrentStep = 0;
  wizFormData = {};
  wizAssets = {};
  renderWizardSteps();
  updateWizardUI();
}

function renderWizardSteps() {
  const container = document.getElementById('wizardSteps');
  const miniSteps  = document.getElementById('wizardStepsMini');
  container.innerHTML = WIZARD_STEPS.map((s, i) => {
    let inner = '';
    if (s.fields) {
      inner = s.fields.map(f => `
        <div class="form-field">
          <label>${f.label}${f.req ? ' *' : ''}</label>
          <input type="${f.type || 'text'}" id="wf_${f.id}" placeholder="${f.ph}" ${f.req ? 'required' : ''}>
          ${f.hint ? `<div class="form-hint">${f.hint}</div>` : ''}
        </div>`).join('');
    } else if (s.dynamic) {
      inner = `
        <div class="na-check-row">
          <input type="checkbox" id="na_${s.id}" onchange="toggleNA('${s.id}')">
          <label for="na_${s.id}">I don't have any ${s.dynamic.label.toLowerCase()}s (mark as N/A)</label>
        </div>
        <div id="dynWrap_${s.id}">
          <div class="dynamic-zone">
            <div id="dynList_${s.id}"></div>
            <button type="button" class="add-row-btn" onclick="addDynRow('${s.id}')">
              <i class="fas fa-plus-circle"></i> Add ${s.dynamic.label}
            </button>
          </div>
        </div>`;
    }
    return `<div class="wiz-step ${i === 0 ? 'active' : ''}" id="ws_${i}">
      <div class="step-badge">Step ${i+1} of ${WIZARD_STEPS.length}</div>
      <h3 class="step-title">${s.title}</h3>
      <p class="step-desc">${s.desc}</p>
      ${inner}
    </div>`;
  }).join('');

  miniSteps.innerHTML = WIZARD_STEPS.map((_, i) =>
    `<div class="wsm-dot ${i === 0 ? 'active' : ''}" id="wsd_${i}"></div>`
  ).join('');
}

function toggleNA(id) {
  const checked = document.getElementById('na_' + id).checked;
  document.getElementById('dynWrap_' + id)?.classList.toggle('na-disabled', checked);
}

function addDynRow(stepId) {
  const step = WIZARD_STEPS.find(s => s.id === stepId);
  if (!step?.dynamic) return;
  const list = document.getElementById('dynList_' + stepId);
  const idx = list.querySelectorAll('.dyn-row').length;
  const div = document.createElement('div');
  div.className = 'dyn-row';
  div.dataset.idx = idx;
  div.innerHTML = step.dynamic.fields.map(f =>
    `<div class="form-field" style="margin:0">
      <label>${f.label} #${idx+1}</label>
      <input type="${f.type || 'text'}" class="dyn-field" data-field="${f.id}" placeholder="${f.ph}">
    </div>`
  ).join('') +
  `<button type="button" class="rm-btn" onclick="this.closest('.dyn-row').remove()">
    <i class="fas fa-times"></i>
  </button>`;
  list.appendChild(div);
}

function collectDynRows(stepId) {
  const list = document.getElementById('dynList_' + stepId);
  if (!list) return [];
  return Array.from(list.querySelectorAll('.dyn-row')).map(row => {
    const obj = {};
    row.querySelectorAll('.dyn-field').forEach(inp => { obj[inp.dataset.field] = inp.value; });
    return Object.values(obj).some(v => v.trim()) ? obj : null;
  }).filter(Boolean);
}

function wizStep(dir) {
  const stepDef = WIZARD_STEPS[wizCurrentStep];

  // Collect current step data
  if (dir === 1) {
    if (stepDef.fields) {
      for (const f of stepDef.fields.filter(x => x.req)) {
        const el = document.getElementById('wf_' + f.id);
        if (!el.value.trim()) {
          el.focus();
          el.style.borderColor = 'var(--red)';
          setTimeout(() => el.style.borderColor = '', 2000);
          toast('Please fill: ' + f.label, 'error');
          return;
        }
      }
      stepDef.fields.forEach(f => {
        const el = document.getElementById('wf_' + f.id);
        if (el) wizFormData[f.id] = el.value.trim();
      });
    } else if (stepDef.dynamic) {
      const isNA = document.getElementById('na_' + stepDef.id)?.checked;
      wizAssets[stepDef.id] = isNA ? [] : collectDynRows(stepDef.id);
    }
  }

  const next = wizCurrentStep + dir;
  if (next < 0) return;
  if (next >= WIZARD_STEPS.length) {
    runFIRECalculation();
    return;
  }

  document.getElementById('ws_' + wizCurrentStep).classList.remove('active');
  wizCurrentStep = next;
  document.getElementById('ws_' + wizCurrentStep).classList.add('active');
  updateWizardUI();

  // Auto-add first row for dynamic steps
  const newStep = WIZARD_STEPS[wizCurrentStep];
  if (newStep?.dynamic) {
    const list = document.getElementById('dynList_' + newStep.id);
    if (list && list.querySelectorAll('.dyn-row').length === 0) {
      addDynRow(newStep.id);
    }
  }
}

function updateWizardUI() {
  const total = WIZARD_STEPS.length;
  document.getElementById('wizardProgress').style.width = ((wizCurrentStep + 1) / total * 100) + '%';
  document.getElementById('wizardSubtitle').textContent =
    `Step ${wizCurrentStep + 1} of ${total} — ${WIZARD_STEPS[wizCurrentStep].title}`;

  for (let i = 0; i < total; i++) {
    const dot = document.getElementById('wsd_' + i);
    if (!dot) continue;
    dot.classList.remove('active', 'done');
    if (i < wizCurrentStep) dot.classList.add('done');
    else if (i === wizCurrentStep) dot.classList.add('active');
  }

  const prevBtn = document.getElementById('wizPrevBtn');
  const nextBtn = document.getElementById('wizNextBtn');
  prevBtn.style.display = wizCurrentStep === 0 ? 'none' : 'inline-flex';
  const isLast = wizCurrentStep === total - 1;
  nextBtn.innerHTML = isLast
    ? '<i class="fas fa-calculator"></i> Calculate FIRE!'
    : 'Continue <i class="fas fa-arrow-right"></i>';
}

// ── Run FIRE calculation ────────────────────────────────────────────
async function runFIRECalculation() {
  // Collect last step if dynamic
  const lastStep = WIZARD_STEPS[wizCurrentStep];
  if (lastStep.dynamic) {
    const isNA = document.getElementById('na_' + lastStep.id)?.checked;
    wizAssets[lastStep.id] = isNA ? [] : collectDynRows(lastStep.id);
  }

  const btn = document.getElementById('wizNextBtn');
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Calculating...';
  btn.disabled = true;

  try {
    const payload = {
      fire_goal:     parseFloat(wizFormData.fire_goal) || 0,
      current_age:   parseInt(wizFormData.current_age) || 30,
      retire_age:    parseInt(wizFormData.retire_age) || 45,
      inflation_rate:parseFloat(wizFormData.inflation) || 6,
      assets:        wizAssets,
    };

    const result = await API.calculateFire(payload);
    result._portName = wizFormData.port_name || 'My Portfolio';
    window._activeResult = result;
    window._activePortName = result._portName;

    // Save portfolio
    try {
      await API.savePortfolio({
        name: result._portName,
        form_data: wizFormData,
        assets: wizAssets,
        calc_result: result
      });
      await loadPortfoliosPage(false);
    } catch {}

    renderResultsPage(result, result._portName);
    navigate('results');
  } catch(e) {
    toast('Calculation failed: ' + e.message, 'error');
  } finally {
    btn.innerHTML = '<i class="fas fa-calculator"></i> Calculate FIRE!';
    btn.disabled = false;
  }
}

// ── Render Results ──────────────────────────────────────────────────
let resultsCharts = {};

function renderResultsPage(r, name) {
  const container = document.getElementById('resultsPage');
  const isGood = r.can_retire;

  container.innerHTML = `
  <div class="results-hero ${isGood ? 'rh-success' : 'rh-warning'}">
    <div class="rh-mascot">${isGood ? '🎉' : '💪'}</div>
    <div class="rh-title">${isGood ? '🏆 You CAN Retire Early!' : '⚡ You Need a Stronger Plan'}</div>
    <div class="rh-sub">${isGood
      ? `Your projected corpus of ${fmtMoney(r.projected_value)} exceeds FIRE goal by ${fmtMoney(r.surplus)}!`
      : `You're ₹${fmtMoney(r.gap)} short. Here's exactly what you need to do.`
    }</div>
  </div>

  <div class="stats-grid">
    <div class="stat-card"><div class="stat-label">FIRE Goal (Inflation-Adjusted)</div><div class="stat-value gold">${fmtMoney(r.inflation_adj_goal)} <button class="currency-convert-btn" onclick="openCurrencyConverter(${r.inflation_adj_goal},'INR')">💱</button></div></div>
    <div class="stat-card"><div class="stat-label">Projected Portfolio @ Retirement</div><div class="stat-value ${isGood ? '' : 'red'}">${fmtMoney(r.projected_value)} <button class="currency-convert-btn" onclick="openCurrencyConverter(${r.projected_value},'INR')">💱</button></div></div>
    <div class="stat-card"><div class="stat-label">Current Total Assets</div><div class="stat-value">${fmtMoney(r.total_assets)} <button class="currency-convert-btn" onclick="openCurrencyConverter(${r.total_assets},'INR')">💱</button></div></div>
    <div class="stat-card"><div class="stat-label">Weighted Avg Return</div><div class="stat-value blue">${r.weighted_return}% p.a.</div></div>
    <div class="stat-card"><div class="stat-label">Years to Retirement</div><div class="stat-value">${r.years_to_retire} Yrs</div></div>
    <div class="stat-card"><div class="stat-label">${isGood ? 'Surplus' : 'Monthly SIP Needed'}</div><div class="stat-value ${isGood ? '' : 'red'}">${fmtMoney(isGood ? r.surplus : r.required_monthly_sip)}${isGood ? '' : '/mo'}</div></div>
  </div>

  <div class="results-grid-2">
    <div class="chart-card">
      <h4><i class="fas fa-chart-area"></i> Corpus Growth vs FIRE Goal</h4>
      <canvas id="projChart" height="200"></canvas>
    </div>
    <div class="chart-card">
      <h4><i class="fas fa-chart-pie"></i> Asset Allocation</h4>
      <canvas id="assetPieChart" height="200"></canvas>
    </div>
  </div>

  ${!isGood ? `
  <div class="invest-schedule">
    <h4>
      <span><i class="fas fa-table"></i> Age-wise Investment Schedule</span>
      <div class="is-filter">
        <button class="filter-tab active" onclick="switchISFilter('monthly',this)">Monthly</button>
        <button class="filter-tab" onclick="switchISFilter('yearly',this)">Yearly</button>
        <button class="filter-tab" onclick="switchISFilter('daily',this)">Daily</button>
      </div>
    </h4>
    <div class="table-wrap">
      <table class="data-table" id="isTable">
        <thead><tr><th>Age</th><th>Years Left</th><th id="isColHeader">Monthly SIP Needed</th></tr></thead>
        <tbody id="isTableBody">
          ${r.invest_schedule.slice(0,15).map(row =>
            `<tr><td>${row.age}</td><td>${row.years_left}</td><td>${fmtMoney(row.monthly)}</td></tr>`
          ).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="advice-box">
    <div class="advice-icon">🧞</div>
    <div class="advice-text">
      <strong>Omkar's Plan for You:</strong>
      <p>Start a SIP of <strong>${fmtMoney(r.required_monthly_sip)}/month</strong> right away. Increase it by 10% every year.
      At ${r.weighted_return}% returns on your portfolio, you'll reach your FIRE goal by age ${r.retire_age}.
      ${r.total_assets > 0 ? `Your current ₹${fmtMoney(r.total_assets)} corpus will grow to ${fmtMoney(r.projected_value)} — you still need ${fmtMoney(r.gap)} more from SIPs.` : ''}
      </p>
    </div>
  </div>` : `
  <div class="advice-box">
    <div class="advice-icon">🏆</div>
    <div class="advice-text">
      <strong>Omkar Says: You're Crushing It! 🎉</strong>
      <p>Your current assets are projected to reach ${fmtMoney(r.projected_value)} by age ${r.retire_age}, exceeding your FIRE goal by ${fmtMoney(r.surplus)}.
      Keep maintaining your portfolio and consider shifting to more conservative assets as you approach retirement.</p>
    </div>
  </div>`}

  <div class="results-actions">
    <button class="btn-primary" onclick="navigate('liab')"><i class="fas fa-arrow-right"></i> Plan Future Liabilities</button>
    <button class="btn-secondary" onclick="savePortfolioHistory()"><i class="fas fa-save"></i> Save Snapshot</button>
    <button class="btn-secondary" onclick="navigate('portfolio')"><i class="fas fa-briefcase"></i> All Portfolios</button>
  </div>`;

  window._investSchedule = r.invest_schedule;

  setTimeout(() => {
    renderProjectionChart(r);
    renderAssetPieChart(r);
  }, 80);
}

function renderProjectionChart(r) {
  const ctx = document.getElementById('projChart');
  if (!ctx) return;
  if (ctx._chart) ctx._chart.destroy();
  const labels = r.projection.map(p => 'Age ' + p.age);
  ctx._chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Your Corpus',
          data: r.projection.map(p => p.corpus),
          borderColor: '#22a861',
          backgroundColor: 'rgba(34,168,97,.12)',
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 0
        },
        {
          label: 'FIRE Goal',
          data: r.projection.map(p => p.goal),
          borderColor: '#f0b429',
          backgroundColor: 'rgba(240,180,41,.06)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: 'var(--text3)', font: { size: 11, family: 'Nunito' }, padding: 10 } },
        tooltip: { callbacks: { label: ctx => ' ' + fmtMoneyFull(ctx.raw) } }
      },
      scales: {
        x: { ticks: { color: 'var(--text3)', maxTicksLimit: 7, font: { size: 10 } }, grid: { color: 'var(--border2)' } },
        y: { ticks: { color: 'var(--text3)', callback: v => fmtMoney(v), font: { size: 10 } }, grid: { color: 'var(--border2)' } }
      }
    }
  });
}

function renderAssetPieChart(r) {
  const ctx = document.getElementById('assetPieChart');
  if (!ctx) return;
  if (ctx._chart) ctx._chart.destroy();
  const typeMap = r.asset_type_map || {};
  const labels = Object.keys(typeMap);
  const values = Object.values(typeMap);
  if (labels.length === 0) {
    ctx.closest('.chart-card').innerHTML += '<p style="color:var(--text3);text-align:center;padding:20px;">No asset data</p>';
    return;
  }
  const colors = ['#1a7a4a','#f0b429','#22c49a','#8a2be2','#e53e3e','#22d3ee','#f97316','#0ea5e9'];
  ctx._chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length), borderWidth: 3, borderColor: 'var(--card)', hoverOffset: 8 }]
    },
    options: {
      cutout: '62%',
      plugins: {
        legend: { position: 'right', labels: { color: 'var(--text3)', font: { size: 11, family: 'Nunito' }, padding: 8 } },
        tooltip: { callbacks: { label: ctx => ' ' + fmtMoneyFull(ctx.raw) + ' (' + ((ctx.raw/values.reduce((a,b)=>a+b,0))*100).toFixed(1) + '%)' } }
      }
    }
  });
}

function switchISFilter(f, btn) {
  document.querySelectorAll('.is-filter .filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const headers = { monthly: 'Monthly SIP Needed', yearly: 'Yearly SIP Needed', daily: 'Daily SIP Needed' };
  document.getElementById('isColHeader').textContent = headers[f];
  const data = window._investSchedule || [];
  document.getElementById('isTableBody').innerHTML = data.slice(0,15).map(row =>
    `<tr><td>${row.age}</td><td>${row.years_left}</td><td>${fmtMoney(row[f])}</td></tr>`
  ).join('');
}

async function savePortfolioHistory() {
  const r = window._activeResult;
  if (!r) return;
  try {
    await API.saveHistory({ result: r, name: window._activePortName, saved_at: new Date().toISOString() });
    toast('Saved to history! 📁', 'success');
  } catch(e) { toast('Failed to save: ' + e.message, 'error'); }
}
