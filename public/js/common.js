/* ============================================================
   common.js — shared header, footer, theme toggle and helpers
   Injected into every page so the chrome stays identical and
   is defined in exactly one place (single source of truth).
   ============================================================ */

(function () {
  const NAV = [
    { href: 'index.html', label: 'Events' },
    { href: 'host.html', label: 'Host an Event' },
    { href: 'admin.html', label: 'Dashboard' },
    { href: 'about.html', label: 'About' },
    { href: 'contact.html', label: 'Contact' }
  ];

  const page = location.pathname.split('/').pop() || 'index.html';

  function buildHeader() {
    const links = NAV.map(n => {
      const active = n.href === page ? ' active" aria-current="page' : '';
      return `<li class="nav-item"><a class="nav-link${active}" href="${n.href}">${n.label}</a></li>`;
    }).join('');

    return `
    <a class="skip-link" href="#main">Skip to main content</a>
    <header>
      <nav class="navbar navbar-expand-lg cc-nav sticky-top" aria-label="Primary navigation">
        <div class="container">
          <a class="navbar-brand" href="index.html">Campus<span class="dot">Connect</span></a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                  data-bs-target="#nav" aria-controls="nav" aria-expanded="false"
                  aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="nav">
            <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1">
              ${links}
              <li class="nav-item ms-lg-2">
                <button id="themeToggle" class="btn btn-sm theme-toggle px-3"
                        type="button" aria-pressed="false"
                        aria-label="Switch to dark theme">🌙 Dark</button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>`;
  }

  function buildFooter() {
    return `
    <footer class="cc-footer">
      <div class="container d-flex flex-wrap justify-content-between align-items-center gap-2">
        <span>© ${new Date().getFullYear()} CampusConnect · Web Technology Mini Project (ICT 3131)</span>
        <span class="text-muted-2">Built with Express, SQLite &amp; Bootstrap 5</span>
      </div>
    </footer>`;
  }

  function initTheme() {
    const saved = localStorage.getItem('cc-theme') || 'light';
    applyTheme(saved);
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('cc-theme', next);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const dark = theme === 'dark';
    btn.textContent = dark ? '☀️ Light' : '🌙 Dark';
    btn.setAttribute('aria-pressed', String(dark));
    btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  // ---- shared helpers used by page scripts ----
  window.CC = {
    /** fetch JSON and throw an object { status, body } on non-2xx */
    async api(url, options) {
      const res = await fetch(url, options);
      let body = null;
      try { body = await res.json(); } catch (_) {}
      if (!res.ok) throw { status: res.status, body };
      return body;
    },
    /** escape user text before putting it in innerHTML */
    esc(s) {
      return String(s ?? '').replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    /** paint a {field: message} error map onto a form */
    showErrors(form, errors) {
      form.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; el.classList.remove('show'); });
      form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
      Object.entries(errors || {}).forEach(([field, msg]) => {
        const input = form.querySelector(`[name="${field}"]`);
        const slot = form.querySelector(`[data-error-for="${field}"]`);
        if (input) input.classList.add('invalid');
        if (slot) { slot.textContent = msg; slot.classList.add('show'); }
      });
    },
    prettyDate(iso) {
      const d = new Date(iso + 'T00:00:00');
      return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  // mount on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const h = document.getElementById('site-header');
    const f = document.getElementById('site-footer');
    if (h) h.innerHTML = buildHeader();
    if (f) f.innerHTML = buildFooter();
    initTheme();
  });
})();
