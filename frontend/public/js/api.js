/* api.js — Backend API Client */
const API = (() => {
  const BASE = window.location.origin;
  let _token = localStorage.getItem('fwo_token') || '';

  function setToken(t) { _token = t; localStorage.setItem('fwo_token', t); }
  function clearToken() { _token = ''; localStorage.removeItem('fwo_token'); }
  function getToken() { return _token; }

  async function req(method, path, body) {
    try {
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': _token }
      };
      if (body) opts.body = JSON.stringify(body);
      const r = await fetch(BASE + path, opts);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (e) {
      throw e;
    }
  }

  return {
    setToken, clearToken, getToken,
    register: (u, p) => req('POST', '/api/register', { username: u, password: p }),
    login: (u, p) => req('POST', '/api/login', { username: u, password: p }),
    logout: () => req('POST', '/api/logout'),
    resetPassword: (cur, nw) => req('POST', '/api/reset-password', { current_password: cur, new_password: nw }),
    getPortfolios: () => req('GET', '/api/portfolios'),
    savePortfolio: (d) => req('POST', '/api/portfolios', d),
    deletePortfolio: (id) => req('DELETE', `/api/portfolios/${id}`),
    restorePortfolio: (id) => req('POST', `/api/portfolios/${id}/restore`),
    calculateFire: (d) => req('POST', '/api/calculate-fire', d),
    calculateFinal: (d) => req('POST', '/api/calculate-final', d),
    sipCalculate: (d) => req('POST', '/api/sip-calculate', d),
    getHistory: () => req('GET', '/api/history'),
    saveHistory: (d) => req('POST', '/api/history', d),
    getProfile: () => req('GET', '/api/profile'),
    updateProfile: (d) => req('PUT', '/api/profile', d),
    getCurrencyRates: () => req('GET', '/api/currency/rates'),
    convertCurrency: (d) => req('POST', '/api/currency/convert', d),
  };
})();
