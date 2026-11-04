/* host.js — create a new event.
   Feature 3 (Student 2). POST /api/events with JSON body.
   Client-side validation first; the server re-validates. */

(function () {
  const form = document.getElementById('hostForm');
  const alertBox = document.getElementById('formAlert');
  const desc = document.getElementById('description');
  const descCount = document.getElementById('descCount');
  const CATS = ['Workshop', 'Hackathon', 'Cultural', 'Seminar', 'Sports'];

  // set the date input's minimum to today
  document.getElementById('date').min = new Date().toISOString().slice(0, 10);

  desc.addEventListener('input', () => { descCount.textContent = desc.value.trim().length; });

  function validate(d) {
    const e = {};
    if (!d.title || d.title.trim().length < 4) e.title = 'Title must be at least 4 characters.';
    if (!CATS.includes(d.category)) e.category = 'Choose a category.';
    if (!d.organizer || !d.organizer.trim()) e.organizer = 'Organizer is required.';
    if (!d.description || d.description.trim().length < 20) e.description = 'Description must be at least 20 characters.';
    if (!d.venue || !d.venue.trim()) e.venue = 'Venue is required.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date || '')) e.date = 'Pick a date.';
    else if (new Date(d.date) < new Date(new Date().toDateString())) e.date = 'Date cannot be in the past.';
    const cap = Number(d.capacity);
    if (!Number.isInteger(cap) || cap < 1 || cap > 5000) e.capacity = 'Enter a capacity between 1 and 5000.';
    if (d.image && !/^https?:\/\/.+/i.test(d.image)) e.image = 'Enter a valid http(s) URL.';
    return e;
  }

  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    alertBox.className = 'alert d-none';
    const data = Object.fromEntries(new FormData(form).entries());
    const errors = validate(data);
    CC.showErrors(form, errors);
    if (Object.keys(errors).length) {
      alertBox.className = 'alert alert-danger';
      alertBox.textContent = 'Please fix the highlighted fields.';
      return;
    }

    const btn = document.getElementById('hostSubmit');
    btn.disabled = true; btn.textContent = 'Publishing…';
    try {
      const res = await CC.api('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      alertBox.className = 'alert alert-success';
      alertBox.innerHTML = `✅ Event published! <a href="event.html?id=${res.id}">View it here</a>.`;
      form.reset();
      descCount.textContent = '0';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err.body && err.body.errors) {
        CC.showErrors(form, err.body.errors);
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = 'The server rejected some fields. See the messages above.';
      } else {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = 'Could not publish. Please try again.';
      }
    } finally {
      btn.disabled = false; btn.textContent = 'Publish event';
    }
  });
})();
