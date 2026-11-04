/* admin.js — organizer dashboard.
   Feature 4 (Student 2). Reads events, registrations and stats;
   deletes events via DELETE /api/events/:id. */

(function () {
  const eventsBody = document.getElementById('eventsBody');
  const regsBody = document.getElementById('regsBody');
  const regFilter = document.getElementById('regFilter');

  async function loadStats() {
    try {
      const s = await CC.api('/api/stats');
      document.getElementById('statEvents').textContent = s.events;
      document.getElementById('statRegs').textContent = s.registrations;
      document.getElementById('statMsgs').textContent = s.messages;
    } catch (_) {}
  }

  async function loadEvents() {
    const events = await CC.api('/api/events');
    // average fill %
    const fill = events.length
      ? Math.round(events.reduce((a, e) => a + e.registered / e.capacity, 0) / events.length * 100)
      : 0;
    document.getElementById('statFill').textContent = fill + '%';

    eventsBody.innerHTML = events.length
      ? events.map(e => `
        <tr>
          <td><a href="event.html?id=${e.id}" class="text-decoration-none">${CC.esc(e.title)}</a></td>
          <td><span class="badge cat-badge cat-${CC.esc(e.category)}">${CC.esc(e.category)}</span></td>
          <td class="small">${CC.prettyDate(e.date)}</td>
          <td>${e.registered}/${e.capacity}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-danger" data-del="${e.id}"
                    aria-label="Delete ${CC.esc(e.title)}">Delete</button>
          </td>
        </tr>`).join('')
      : '<tr><td colspan="5" class="text-muted-2">No events yet.</td></tr>';

    // rebuild the registration filter dropdown
    regFilter.innerHTML = '<option value="">All events</option>' +
      events.map(e => `<option value="${e.id}">${CC.esc(e.title)}</option>`).join('');
  }

  async function loadRegs() {
    const q = regFilter.value ? '?event_id=' + regFilter.value : '';
    const regs = await CC.api('/api/registrations' + q);
    regsBody.innerHTML = regs.length
      ? regs.map(r => `
        <tr>
          <td>${CC.esc(r.name)}</td>
          <td class="small">${CC.esc(r.email)}</td>
          <td>${CC.esc(r.reg_no)}</td>
          <td>${r.year}</td>
          <td class="small">${CC.esc(r.event_title)}</td>
        </tr>`).join('')
      : '<tr><td colspan="5" class="text-muted-2">No registrations yet.</td></tr>';
  }

  // event delegation for delete buttons
  eventsBody.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-del]');
    if (!btn) return;
    if (!confirm('Delete this event and all its registrations?')) return;
    btn.disabled = true;
    try {
      await CC.api('/api/events/' + btn.dataset.del, { method: 'DELETE' });
      await refresh();
    } catch (_) {
      alert('Could not delete the event.');
      btn.disabled = false;
    }
  });

  regFilter.addEventListener('change', loadRegs);

  async function refresh() {
    await Promise.all([loadStats(), loadEvents()]);
    await loadRegs();
  }

  refresh();
})();
