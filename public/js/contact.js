/* contact.js — contact form (Feature 5, shared).
   POST /api/contact with JSON. Client + server validation. */

(function () {
  const form = document.getElementById('contactForm');
  const alertBox = document.getElementById('contactAlert');

  function validate(d) {
    const e = {};
    if (!d.name || d.name.trim().length < 2) e.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '')) e.email = 'Enter a valid email address.';
    if (!d.subject || d.subject.trim().length < 3) e.subject = 'Subject is too short.';
    if (!d.body || d.body.trim().length < 10) e.body = 'Message must be at least 10 characters.';
    return e;
  }

  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    alertBox.className = 'alert d-none';
    const data = Object.fromEntries(new FormData(form).entries());
    const errors = validate(data);
    CC.showErrors(form, errors);
    if (Object.keys(errors).length) return;

    const btn = document.getElementById('contactSubmit');
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      await CC.api('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      alertBox.className = 'alert alert-success';
      alertBox.textContent = '✅ Thanks! Your message has been received.';
      form.reset();
    } catch (err) {
      if (err.body && err.body.errors) CC.showErrors(form, err.body.errors);
      alertBox.className = 'alert alert-danger';
      alertBox.textContent = 'Could not send your message. Please try again.';
    } finally {
      btn.disabled = false; btn.textContent = 'Send message';
    }
  });
})();
