/* auth.js */
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.auth-tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(tab + 'Tab').classList.add('active');
}

function togglePw(id, btn) {
  const inp = document.getElementById(id);
  const isText = inp.type === 'text';
  inp.type = isText ? 'password' : 'text';
  btn.querySelector('i').className = isText ? 'fas fa-eye' : 'fas fa-eye-slash';
}

function checkUserLen(el) {
  document.getElementById('regUserLen').textContent = el.value.length;
}

function checkPwStrength(pw) {
  const el = document.getElementById('pwStrength');
  if (!el) return;
  let score = 0;
  if (pw.length >= 6) score++;
  if (/[a-zA-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  const colors = ['', '#e53e3e', '#f0b429', '#22a861', '#0f4d2e'];
  const widths = ['0%', '25%', '50%', '75%', '100%'];
  el.style.setProperty('--sw', widths[score]);
  el.style.setProperty('--sc', colors[score]);
  el.style.cssText += `--sw:${widths[score]};--sc:${colors[score]};`;
  el.innerHTML = `<div style="width:${widths[score]};height:100%;background:${colors[score]};border-radius:2px;transition:all .3s;"></div>`;
}

document.getElementById('regPass')?.addEventListener('input', function() {
  checkPwStrength(this.value);
});

async function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const err = document.getElementById('loginErr');
  err.textContent = '';
  if (!u || !p) { err.textContent = 'Please fill in all fields'; return; }
  try {
    const btn = document.querySelector('#loginTab .btn-auth');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    btn.disabled = true;
    const data = await API.login(u, p);
    API.setToken(data.token);
    enterApp(data.username);
  } catch (e) {
    document.getElementById('loginErr').textContent = e.message;
    const btn = document.querySelector('#loginTab .btn-auth');
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
    btn.disabled = false;
  }
}

async function doRegister() {
  const u = document.getElementById('regUser').value.trim();
  const p = document.getElementById('regPass').value;
  const p2 = document.getElementById('regPass2').value;
  const err = document.getElementById('regErr');
  err.textContent = '';
  if (!u || !p || !p2) { err.textContent = 'Please fill all fields'; return; }
  if (p !== p2) { err.textContent = 'Passwords do not match'; return; }
  try {
    const btn = document.querySelector('#registerTab .btn-auth');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    btn.disabled = true;
    const data = await API.register(u, p);
    API.setToken(data.token);
    enterApp(data.username);
  } catch (e) {
    document.getElementById('regErr').textContent = e.message;
    const btn = document.querySelector('#registerTab .btn-auth');
    btn.innerHTML = '<i class="fas fa-rocket"></i> Create Account';
    btn.disabled = false;
  }
}

async function doLogout() {
  try { await API.logout(); } catch {}
  API.clearToken();
  document.getElementById('authPage').classList.add('active');
  document.getElementById('appShell').classList.remove('active');
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  toast('Logged out. See you soon! 👋', 'info');
}

function showResetModal() {
  document.getElementById('resetModal').classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

async function doReset() {
  const cur = document.getElementById('curPw').value;
  const nw = document.getElementById('newPw').value;
  const conf = document.getElementById('confPw').value;
  const msg = document.getElementById('resetMsg');
  msg.className = 'form-msg';
  if (nw !== conf) { msg.className = 'form-msg err'; msg.textContent = 'Passwords do not match'; return; }
  try {
    await API.resetPassword(cur, nw);
    msg.className = 'form-msg ok';
    msg.textContent = '✅ Password updated successfully!';
    setTimeout(() => closeModal('resetModal'), 2000);
  } catch (e) {
    msg.className = 'form-msg err';
    msg.textContent = e.message;
  }
}

// Handle Enter key in auth forms
document.getElementById('loginPass')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('regPass2')?.addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });
