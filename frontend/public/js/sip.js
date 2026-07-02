/* sip.js — SIP Calculator (Groww-style) */

let sipChartInstance = null;
let sipMode = 'sip'; // 'sip' or 'lumpsum'

function fmtMoney(n) {
  if (!n && n !== 0) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 10000000) return sign + '₹' + (abs/10000000).toFixed(2) + ' Cr';
  if (abs >= 100000)   return sign + '₹' + (abs/100000).toFixed(2) + ' L';
  if (abs >= 1000)     return sign + '₹' + (abs/1000).toFixed(1) + 'K';
  return sign + '₹' + Math.round(abs).toLocaleString('en-IN');
}

function fmtMoneyFull(n) {
  return '₹' + Math.round(Math.abs(n)).toLocaleString('en-IN');
}

function switchSIPMode(mode) {
  sipMode = mode;
  document.querySelectorAll('.sip-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  const monthlyLabel = document.getElementById('sipAmtLabel');
  if (monthlyLabel) {
    monthlyLabel.textContent = mode === 'sip' ? 'Monthly Investment' : 'Total Investment (Lumpsum)';
  }
  recalcSIP();
}

async function recalcSIP() {
  const amt  = +document.getElementById('sipAmt').value;
  const rate = +document.getElementById('sipRate').value;
  const yrs  = +document.getElementById('sipYrs').value;

  document.getElementById('sipAmtV').textContent = fmtMoneyFull(amt);
  document.getElementById('sipRateV').textContent = rate + '%';
  document.getElementById('sipYrsV').textContent = yrs + ' Yr' + (yrs > 1 ? 's' : '');

  let invested, returns, total, yearly;

  if (sipMode === 'lumpsum') {
    const r = rate / 100;
    total = amt * Math.pow(1 + r, yrs);
    invested = amt;
    returns = total - invested;
    yearly = [];
    for (let yr = 1; yr <= yrs; yr++) {
      const v = amt * Math.pow(1 + r, yr);
      yearly.push({ year: yr, invested: amt, value: v, returns: v - amt });
    }
  } else {
    try {
      const d = await API.sipCalculate({ monthly_amount: amt, annual_rate: rate, years: yrs });
      invested = d.total_invested;
      returns = d.estimated_returns;
      total = d.total_value;
      yearly = d.yearly_breakdown;
    } catch {
      const n = yrs * 12;
      const r = rate / 100 / 12;
      total = r > 0 ? amt * (((1+r)**n - 1)/r) * (1+r) : amt * n;
      invested = amt * n;
      returns = total - invested;
      yearly = [];
      for (let yr = 1; yr <= yrs; yr++) {
        const nm = yr * 12;
        const v = r > 0 ? amt * (((1+r)**nm - 1)/r) * (1+r) : amt * nm;
        yearly.push({ year: yr, invested: amt * nm, value: v, returns: v - amt * nm });
      }
    }
  }

  document.getElementById('sipInvested').textContent = fmtMoneyFull(invested);
  document.getElementById('sipReturns').textContent  = fmtMoneyFull(returns);
  document.getElementById('sipTotal').textContent    = fmtMoneyFull(total);

  renderSIPDonut(invested, returns);
  renderSIPChart(yearly);
}

function renderSIPDonut(invested, returns) {
  const ctx = document.getElementById('sipDonut');
  if (!ctx) return;
  if (ctx._chart) ctx._chart.destroy();
  ctx._chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Invested', 'Est. Returns'],
      datasets: [{
        data: [invested, Math.max(0, returns)],
        backgroundColor: ['#e8eaf0', '#5367ff'],
        borderWidth: 0,
        hoverOffset: 6,
      }]
    },
    options: {
      cutout: '72%',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ' ' + fmtMoneyFull(ctx.raw) }
        }
      }
    }
  });
}

function renderSIPChart(yearly) {
  const ctx = document.getElementById('sipChart');
  if (!ctx) return;
  if (sipChartInstance) sipChartInstance.destroy();
  const labels = yearly.map(y => 'Yr ' + y.year);
  sipChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Invested',
          data: yearly.map(y => y.invested),
          backgroundColor: 'rgba(26,122,74,.55)',
          borderRadius: 4,
          stack: 'a'
        },
        {
          label: 'Returns',
          data: yearly.map(y => y.returns),
          backgroundColor: 'rgba(83,103,255,.8)',
          borderRadius: 4,
          stack: 'a'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: 'var(--text3)', font: { size: 10, family: 'Nunito' }, padding: 8 }
        },
        tooltip: {
          callbacks: { label: ctx => ' ' + fmtMoneyFull(ctx.raw) }
        }
      },
      scales: {
        x: { stacked: true, ticks: { color: 'var(--text3)', font: { size: 9 } }, grid: { display: false } },
        y: { stacked: true, ticks: { color: 'var(--text3)', font: { size: 9 }, callback: v => fmtMoney(v) }, grid: { color: 'var(--border2)' } }
      }
    }
  });
}
