/* event.js — renders one event and handles registration.
   Feature 2 (Student 1). Client-side validation runs first;
   the server re-validates and enforces capacity + duplicates. */

(function () {
  const id = new URLSearchParams(location.search).get('id');
  const detail = document.getElementById('eventDetail');
  let modal, current;

  function render(ev) {
    current = ev;
    document.title = `${ev.title} — CampusConnect`;
    const left = ev.capacity - ev.registered;
    const pct = Math.min(100, Math.round((ev.registered / ev.capacity) * 100));
    const img = ev.image || 'img/placeholder.svg';
    const full = left <= 0;
    detail.innerHTML = `
      <article class="cc-card">
        <img src="${CC.esc(img)}" alt="" style="height:280px" onerror="this.onerror=null;this.src='img/placeholder.svg'" />
        <div class="p-4">
          <span class="badge cat-badge cat-${CC.esc(ev.category)} mb-2">${CC.esc(ev.category)}</span>
          <h1 class="h2">${CC.esc(ev.title)}</h1>
          <p class="text-muted-2">Organized by ${CC.esc(ev.organizer)}</p>
          <dl class="row mt-3">
            <dt class="col-sm-3">Date</dt><dd class="col-sm-9">${CC.prettyDate(ev.date)}</dd>
            <dt class="col-sm-3">Venue</dt><dd class="col-sm-9">${CC.esc(ev.venue)}</dd>
            <dt class="col-sm-3">Seats</dt>
            <dd class="col-sm-9">
              ${ev.registered} / ${ev.capacity} registered
              <div class="seat-bar mt-1" role="img" aria-label="${pct}% of seats filled"><span style="width:${pct}%"></span></div>
            </dd>
          </dl>
          <p>${CC.esc(ev.description)}</p>
          <button id="openReg" class="btn btn-primary btn-lg mt-2" ${full ? 'disabled' : ''}>
            ${full ? 'Event is full' : 'Register now'}
          </button>
        </div>
      </article>`;
    if (!full) {
      document.getElementById('openReg').addEventListener('click', () => modal.show());
    }
  }

  // ---- client-side validation mirroring the server rules ----
  function validate(data) {
    const e = {};
    if (!data.name || data.name.trim().length < 2) e.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) e.email = 'Enter a valid email address.';
    if (!/^[A-Za-z0-9]{6,15}$/.test((data.reg_no || '').trim())) e.reg_no = 'Registration number looks invalid (6–15 letters/digits).';
    if (![1, 2, 3, 4].includes(Number(data.year))) e.year = 'Select your year of study.';
    return e;
  }

  async function submit(evt) {
    evt.preventDefault();
    const form = evt.target;
    const data = Object.fromEntries(new FormData(form).entries());
    const alert = document.getElementById('regAlert');
    alert.className = 'alert d-none';

    const errors = validate(data);
    CC.showErrors(form, errors);
    if (Object.keys(errors).length) return;

    const btn = document.getElementById('regSubmit');
    btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      const res = await CC.api(`/api/events/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      modal.hide();
      detail.insertAdjacentHTML('afterbegin',
        `<div class="alert alert-success" role="alert">
           🎉 You're registered! ${res.seatsLeft} seat${res.seatsLeft === 1 ? '' : 's'} left.
         </div>`);
      form.reset();
      load(); // refresh seat count
    } catch (err) {
      if (err.body && err.body.errors) {
        CC.showErrors(form, err.body.errors);
      } else {
        alert.className = 'alert alert-danger';
        alert.textContent = (err.body && err.body.error) || 'Something went wrong. Try again.';
      }
    } finally {
      btn.disabled = false; btn.textContent = 'Confirm registration';
    }
  }

  async function load() {
    try {
      render(await CC.api('/api/events/' + id));
    } catch (e) {
      detail.innerHTML = '<div class="alert alert-warning">Event not found.</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!id) { detail.innerHTML = '<div class="alert alert-warning">No event selected.</div>'; return; }
    modal = new bootstrap.Modal(document.getElementById('regModal'));
    document.getElementById('regForm').addEventListener('submit', submit);
    load();
  });
})();
