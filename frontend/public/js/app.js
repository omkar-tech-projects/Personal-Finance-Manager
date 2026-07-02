/* app.js — Main App Controller */
// ── Dropdown (click-toggled, closes on outside click) ───────────────
function togglePortfolioDropdown(e) {
  e.stopPropagation();
  const dd = document.getElementById('portfolioDropdown');
  dd.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const dd = document.getElementById('portfolioDropdown');
  if (dd && !dd.closest('.nav-dropdown-wrap')?.contains(e.target)) {
    dd.classList.remove('open');
  }
});



// ── Navigation ──────────────────────────────────────────────────────
function navigate(page, param) {
  document.querySelectorAll('.app-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const target = page + 'Page';
  const el = document.getElementById(target);
  if (el) el.classList.add('active');

  if (page === 'home') {
    document.getElementById('nb-home').classList.add('active');
  } else if (page === 'portfolio' || page === 'portmaker') {
    document.getElementById('nb-portfolio').classList.add('active');
  }

  if (page === 'home') {
    // Lazy load home content
    loadHomeMarkets();
  } else if (page === 'markets') {
    loadMarketsPage();
  } else if (page === 'portfolio') {
    loadPortfoliosPage(param === 'deleted');
  } else if (page === 'portmaker') {
    initWizard();
  } else if (page === 'liab') {
    initLiabilities();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Enter App ───────────────────────────────────────────────────────
function enterApp(username) {
  document.getElementById('authPage').classList.remove('active');
  document.getElementById('appShell').classList.add('active');
  document.getElementById('navUser').textContent = username;
  document.getElementById('navAvatar').textContent = username[0].toUpperCase();
  document.getElementById('mascotFloat').style.display = 'flex';

  // Init all home page content
  initCarousel();
  recalcSIP();
  loadHomeMarkets();
  loadNews('india');
  loadTips();
  startMascotAuto();
  setTimeout(() => showMascotTip(), 4000);

  navigate('home');
}

// ── Carousel ────────────────────────────────────────────────────────
let slideIndex = 0;
let slideTimer = null;
const SLIDE_COUNT = 4;

function initCarousel() {
  const dots = document.getElementById('carrDots');
  dots.innerHTML = '';
  for (let i = 0; i < SLIDE_COUNT; i++) {
    const d = document.createElement('button');
    d.className = 'carr-dot' + (i === 0 ? ' active' : '');
    d.onclick = () => goSlide(i);
    dots.appendChild(d);
  }
  clearInterval(slideTimer);
  slideTimer = setInterval(() => moveSlide(1), 5500);
}

function moveSlide(dir) {
  goSlide((slideIndex + dir + SLIDE_COUNT) % SLIDE_COUNT);
}

function goSlide(i) {
  slideIndex = i;
  document.getElementById('carouselTrack').style.transform = `translateX(-${i * 100}%)`;
  document.querySelectorAll('.carr-dot').forEach((d, j) => d.classList.toggle('active', j === i));
}

// ── Theme ───────────────────────────────────────────────────────────
function toggleTheme() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
  localStorage.setItem('fwo_theme', dark ? 'light' : 'dark');
  document.getElementById('themeBtn').innerHTML = dark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

(function initTheme() {
  const saved = localStorage.getItem('fwo_theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('themeBtn').innerHTML = '<i class="fas fa-sun"></i>';
  }
})();

// ── Toast ───────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success: 'fas fa-check-circle', error: 'fas fa-exclamation-circle', info: 'fas fa-info-circle' };
  t.innerHTML = `<i class="${icons[type] || icons.info}"></i> ${escHtml(msg)}`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// ── Mobile Menu ─────────────────────────────────────────────────────
function toggleMobileMenu() {
  const nav = document.getElementById('navLinks');
  nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
  nav.style.flexDirection = 'column';
  nav.style.position = 'absolute';
  nav.style.top = '62px';
  nav.style.left = '0';
  nav.style.right = '0';
  nav.style.background = 'var(--card)';
  nav.style.padding = '12px';
  nav.style.borderBottom = '1px solid var(--border)';
  nav.style.zIndex = '99';
}

// ── Floating symbols animation (auth page) ─────────────────────────
function initFloatingSymbols() {
  const el = document.getElementById('floatingSymbols');
  if (!el) return;
  const syms = ['₹', '$', '€', '£', '¥', '📈', '💰', '🏦', '📊', '💎'];
  for (let i = 0; i < 15; i++) {
    const s = document.createElement('div');
    s.textContent = syms[Math.floor(Math.random() * syms.length)];
    s.style.cssText = `
      position:absolute;
      font-size:${Math.random() * 20 + 12}px;
      opacity:${Math.random() * 0.12 + 0.04};
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      animation:float${Math.floor(Math.random() * 3) + 1} ${Math.random() * 8 + 6}s ease-in-out infinite;
      animation-delay:${Math.random() * 8}s;
      color:${['#f0b429','#22c49a','rgba(255,255,255,0.8)'][Math.floor(Math.random()*3)]};
      user-select:none;
      pointer-events:none;
    `;
    el.appendChild(s);
  }
  // Add CSS keyframes dynamically
  const style = document.createElement('style');
  style.textContent = `
    @keyframes float1{0%,100%{transform:translateY(0) rotate(0);}50%{transform:translateY(-30px) rotate(10deg);}}
    @keyframes float2{0%,100%{transform:translateY(0) rotate(0);}50%{transform:translateY(-20px) rotate(-8deg);}}
    @keyframes float3{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-40px) scale(1.1);}}
  `;
  document.head.appendChild(style);
}

// ── Auto-login if token exists ─────────────────────────────────────
async function checkAutoLogin() {
  const token = API.getToken();
  if (!token) { return; }
  try {
    // Validate token by fetching portfolios
    await API.getPortfolios();
    // Token valid — but we don't have username easily, decode from users
    const users = {};
    enterApp(localStorage.getItem('fwo_username') || 'User');
  } catch {
    API.clearToken();
    // initFloatingSymbols();
  }
}

// Save username on login
const _origEnterApp = enterApp;

// ── Keyboard shortcuts ──────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
    document.getElementById('mascotBubble').style.display = 'none';
  }
});

// ── Init ────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  checkAutoLogin();
});

// Track username for auto-login
// Track username for auto-login
document.getElementById('loginUser')?.addEventListener('change', function() {
  localStorage.setItem('fwo_username', this.value.trim());
});
document.getElementById('regUser')?.addEventListener('change', function() {
  localStorage.setItem('fwo_username', this.value.trim());
});
