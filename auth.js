/* ══════════════════════════════════
   auth.js — Session & Auth Manager
══════════════════════════════════ */

(function checkAuth() {
  const auth = localStorage.getItem('wbm-auth');
  const expiry = parseInt(localStorage.getItem('wbm-auth-expiry') || '0');
  const now = Date.now();

  if (auth !== 'true' || now > expiry) {
    localStorage.removeItem('wbm-auth');
    localStorage.removeItem('wbm-auth-expiry');
    window.location.href = 'index.html';
  } else {
    // Extend session by 24 hours on every page load
    localStorage.setItem('wbm-auth-expiry', now + 24 * 60 * 60 * 1000);
  }
})();

function logout() {
  if (confirm('Log out of the CMS?')) {
    localStorage.removeItem('wbm-auth');
    localStorage.removeItem('wbm-auth-expiry');
    window.location.href = 'index.html';
  }
}
