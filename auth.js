/* ══════════════════════════════════
   auth.js — paste this at the TOP
   of your existing script.js
══════════════════════════════════ */

/* ── Auth check: runs on every page load ── */
(function checkAuth() {
  if (sessionStorage.getItem('wbm-auth') !== 'true') {
    window.location.href = 'index.html';
  }
})();

/* ── Logout ── */
function logout() {
  if (confirm('Log out of the CMS?')) {
    sessionStorage.removeItem('wbm-auth');
    window.location.href = 'index.html';
  }
}
