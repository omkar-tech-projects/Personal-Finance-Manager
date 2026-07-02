/* mascot.js — Mascot with live finance tips */

const MASCOT_TIPS = [
  { icon: '🚀', title: 'Power of Compounding', text: 'Einstein called it the 8th wonder. ₹5,000/month at 12% for 30 years = ₹1.76 Crore! Start NOW.' },
  { icon: '📊', title: 'Rule of 72', text: 'Divide 72 by your return rate to find how long to double money. At 12%: 6 years! At 6%: 12 years.' },
  { icon: '🛡️', title: 'Emergency Fund First', text: 'Keep 6 months of expenses in liquid funds before investing. Life loves surprises!' },
  { icon: '💰', title: 'Step-Up SIP Magic', text: 'Increase SIP by 10% every year. A ₹5K SIP becomes equivalent to ₹13K in 10 years of growth!' },
  { icon: '📈', title: 'Index > Active', text: '80% of active funds underperform NIFTY 50 over 10 years. Low-cost index = smart choice.' },
  { icon: '🏠', title: 'Home EMI Rule', text: 'Your home loan EMI should never exceed 35-40% of take-home salary. Stretch = financial stress.' },
  { icon: '🎯', title: '50-30-20 Rule', text: '50% needs, 30% wants, 20% savings. Simple. Powerful. Life-changing.' },
  { icon: '💡', title: 'Term Insurance', text: 'Get term insurance = 10–15x your annual income. A ₹1 Crore cover can cost just ₹800/month!' },
  { icon: '🔄', title: 'Rebalance Annually', text: 'Review and rebalance portfolio every year. If equity grows to 80%, trim and reinvest in debt.' },
  { icon: '📅', title: 'Automate Everything', text: 'Set auto-debit for SIPs on salary day. Out of sight = out of temptation = more wealth!' },
  { icon: '🌟', title: 'Avoid Lifestyle Inflation', text: 'Got a raise? Invest 50% of the increment. Lifestyle costs always find a way to rise!' },
  { icon: '🧠', title: 'Tax Harvesting', text: 'Book LTCG up to ₹1L every year tax-free. Reinvest to reset cost basis. Free money!' },
];

let mascotTipIndex = 0;
let mascotInterval = null;

function loadTips() {
  const el = document.getElementById('tipsList');
  if (!el) return;
  const shuffled = [...MASCOT_TIPS].sort(() => Math.random() - 0.5).slice(0, 4);
  el.innerHTML = shuffled.map(t => `
    <div class="tip-item">
      <div class="tip-icon">${t.icon}</div>
      <div class="tip-body">
        <div class="tip-title">${t.title}</div>
        <div class="tip-text">${t.text}</div>
      </div>
    </div>
  `).join('');
}

function showMascotTip() {
  const bubble = document.getElementById('mascotBubble');
  const tip = MASCOT_TIPS[mascotTipIndex % MASCOT_TIPS.length];
  mascotTipIndex++;
  document.getElementById('mascotTipText').innerHTML = `<strong>${tip.icon} ${tip.title}:</strong> ${tip.text}`;
  bubble.style.display = 'block';
  clearTimeout(mascotInterval);
  mascotInterval = setTimeout(() => closeMascotTip(), 8000);
}

function closeMascotTip() {
  document.getElementById('mascotBubble').style.display = 'none';
}

// Auto show tip every 45 seconds
function startMascotAuto() {
  setInterval(() => {
    if (document.getElementById('appShell').classList.contains('active')) {
      showMascotTip();
    }
  }, 45000);
}
