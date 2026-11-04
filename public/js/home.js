/* home.js — events listing with debounced live search + category filter.
   Feature 1 (Student 1). Talks to GET /api/events?search=&category= */

(function () {
  const form = document.getElementById('filterForm');
  const grid = document.getElementById('eventGrid');
  const count = document.getElementById('resultCount');
  const empty = document.getElementById('emptyState');
  const searchInput = document.getElementById('search');
  const categorySel = document.getElementById('category');
  let timer;

  function card(ev) {
    const pct = Math.min(100, Math.round((ev.registered / ev.capacity) * 100));
    const left = ev.capacity - ev.registered;
    const img = ev.image || 'img/placeholder.svg';
    return `
      <div class="col-sm-6 col-lg-4">
        <article class="cc-card d-flex flex-column">
          <img src="${CC.esc(img)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='img/placeholder.svg'" />
          <div class="p-3 d-flex flex-column flex-grow-1">
            <span class="badge cat-badge cat-${CC.esc(ev.category)} align-self-start mb-2">${CC.esc(ev.category)}</span>
            <h3 class="h5"><a class="stretched-link text-decoration-none" href="event.html?id=${ev.id}">${CC.esc(ev.title)}</a></h3>
            <p class="text-muted-2 small mb-2">📍 ${CC.esc(ev.venue)} · 📅 ${CC.prettyDate(ev.date)}</p>
            <p class="small flex-grow-1">${CC.esc(ev.description.slice(0, 90))}${ev.description.length > 90 ? '…' : ''}</p>
            <div class="seat-bar mb-1" role="img" aria-label="${ev.registered} of ${ev.capacity} seats filled">
              <span style="width:${pct}%"></span>
            </div>
            <p class="small text-muted-2 mb-0">${left > 0 ? left + ' seats left' : 'Full'}</p>
          </div>
        </article>
      </div>`;
  }

  async function load() {
    const params = new URLSearchParams({
      search: searchInput.value.trim(),
      category: categorySel.value
    });
    grid.setAttribute('aria-busy', 'true');
    try {
      const events = await CC.api('/api/events?' + params.toString());
      grid.innerHTML = events.map(card).join('');
      count.textContent = `${events.length} event${events.length === 1 ? '' : 's'} found`;
      empty.classList.toggle('d-none', events.length !== 0);
    } catch (e) {
      count.textContent = 'Could not load events. Is the server running?';
    } finally {
      grid.setAttribute('aria-busy', 'false');
    }
  }

  searchInput.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(load, 250); });
  categorySel.addEventListener('change', load);
  form.addEventListener('submit', (e) => { e.preventDefault(); load(); });
  document.getElementById('resetBtn').addEventListener('click', () => setTimeout(load, 0));

  load();
})();
