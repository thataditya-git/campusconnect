/**
 * server.js  —  CampusConnect backend (Express)
 * ------------------------------------------------------------
 * Serves the static front end from /public and exposes a small
 * JSON REST API. Every POST endpoint performs SERVER-SIDE
 * validation and returns 400 with a field-level error map when
 * the data is invalid, so the front end can show messages next
 * to the offending fields.
 *
 * Data is exchanged as JSON (Content-Type: application/json).
 */

const path = require('path');
const express = require('express');
const { db, init, seed } = require('./db');

init();
seed();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ----------------------------- helpers ----------------------------- */

const CATEGORIES = ['Workshop', 'Hackathon', 'Cultural', 'Seminar', 'Sports'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmpty(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Validate an event create payload. Returns an errors object (empty = valid). */
function validateEvent(b) {
  const e = {};
  if (!isNonEmpty(b.title) || b.title.trim().length < 4)
    e.title = 'Title must be at least 4 characters.';
  if (!CATEGORIES.includes(b.category))
    e.category = 'Choose a valid category.';
  if (!isNonEmpty(b.description) || b.description.trim().length < 20)
    e.description = 'Description must be at least 20 characters.';
  if (!isNonEmpty(b.venue))
    e.venue = 'Venue is required.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '')) {
    e.date = 'Pick a valid date.';
  } else if (new Date(b.date) < new Date(new Date().toDateString())) {
    e.date = 'Event date cannot be in the past.';
  }
  const cap = Number(b.capacity);
  if (!Number.isInteger(cap) || cap < 1 || cap > 5000)
    e.capacity = 'Capacity must be a whole number between 1 and 5000.';
  if (!isNonEmpty(b.organizer))
    e.organizer = 'Organizer is required.';
  if (b.image && !/^https?:\/\/.+/i.test(b.image))
    e.image = 'Image must be a valid http(s) URL.';
  return e;
}

/** Validate a registration payload. */
function validateRegistration(b) {
  const e = {};
  if (!isNonEmpty(b.name) || b.name.trim().length < 2)
    e.name = 'Please enter your full name.';
  if (!EMAIL_RE.test(b.email || ''))
    e.email = 'Enter a valid email address.';
  if (!/^[A-Za-z0-9]{6,15}$/.test((b.reg_no || '').trim()))
    e.reg_no = 'Registration number looks invalid.';
  const yr = Number(b.year);
  if (![1, 2, 3, 4].includes(yr))
    e.year = 'Select your year of study (1–4).';
  return e;
}

/** Validate a contact message payload. */
function validateMessage(b) {
  const e = {};
  if (!isNonEmpty(b.name) || b.name.trim().length < 2)
    e.name = 'Please enter your name.';
  if (!EMAIL_RE.test(b.email || ''))
    e.email = 'Enter a valid email address.';
  if (!isNonEmpty(b.subject) || b.subject.trim().length < 3)
    e.subject = 'Subject is too short.';
  if (!isNonEmpty(b.body) || b.body.trim().length < 10)
    e.body = 'Message must be at least 10 characters.';
  return e;
}

/* --------------------------- EVENTS API ---------------------------- */

// List events, with optional ?search= and ?category= filtering.
app.get('/api/events', (req, res) => {
  const { search = '', category = '' } = req.query;
  let sql = `
    SELECT e.*,
      (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered
    FROM events e WHERE 1 = 1`;
  const params = {};
  if (search.trim()) {
    sql += ' AND (e.title LIKE @q OR e.description LIKE @q OR e.organizer LIKE @q)';
    params.q = `%${search.trim()}%`;
  }
  if (category.trim() && CATEGORIES.includes(category)) {
    sql += ' AND e.category = @cat';
    params.cat = category;
  }
  sql += ' ORDER BY e.date ASC';
  res.json(db.prepare(sql).all(params));
});

// Single event by id.
app.get('/api/events/:id', (req, res) => {
  const ev = db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered
    FROM events e WHERE e.id = ?`).get(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Event not found.' });
  res.json(ev);
});

// Create a new event.
app.post('/api/events', (req, res) => {
  const errors = validateEvent(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  const b = req.body;
  const info = db.prepare(`
    INSERT INTO events (title, category, description, venue, date, capacity, organizer, image)
    VALUES (@title, @category, @description, @venue, @date, @capacity, @organizer, @image)
  `).run({
    title: b.title.trim(),
    category: b.category,
    description: b.description.trim(),
    venue: b.venue.trim(),
    date: b.date,
    capacity: Number(b.capacity),
    organizer: b.organizer.trim(),
    image: b.image ? b.image.trim() : null
  });
  res.status(201).json({ id: info.lastInsertRowid });
});

// Delete an event (admin).
app.delete('/api/events/:id', (req, res) => {
  const info = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Event not found.' });
  res.json({ deleted: true });
});

/* ------------------------ REGISTRATIONS API ------------------------ */

// Register for an event.
app.post('/api/events/:id/register', (req, res) => {
  const ev = db.prepare(`
    SELECT e.*, (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered
    FROM events e WHERE e.id = ?`).get(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Event not found.' });

  const errors = validateRegistration(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ errors });

  // Business rules enforced on the server.
  if (ev.registered >= ev.capacity)
    return res.status(409).json({ error: 'Sorry, this event is full.' });

  const dup = db.prepare(
    'SELECT 1 FROM registrations WHERE event_id = ? AND lower(email) = lower(?)'
  ).get(ev.id, req.body.email.trim());
  if (dup) return res.status(409).json({ error: 'You have already registered with this email.' });

  const b = req.body;
  db.prepare(`
    INSERT INTO registrations (event_id, name, email, reg_no, year)
    VALUES (?, ?, ?, ?, ?)
  `).run(ev.id, b.name.trim(), b.email.trim(), b.reg_no.trim(), Number(b.year));

  const seatsLeft = ev.capacity - ev.registered - 1;
  res.status(201).json({ ok: true, seatsLeft });
});

// All registrations, optionally for one event (admin).
app.get('/api/registrations', (req, res) => {
  const { event_id } = req.query;
  let sql = `
    SELECT r.*, e.title AS event_title
    FROM registrations r JOIN events e ON e.id = r.event_id`;
  const params = [];
  if (event_id) { sql += ' WHERE r.event_id = ?'; params.push(event_id); }
  sql += ' ORDER BY r.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

/* --------------------------- CONTACT API --------------------------- */

app.post('/api/contact', (req, res) => {
  const errors = validateMessage(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  const b = req.body;
  db.prepare(`
    INSERT INTO messages (name, email, subject, body) VALUES (?, ?, ?, ?)
  `).run(b.name.trim(), b.email.trim(), b.subject.trim(), b.body.trim());
  res.status(201).json({ ok: true });
});

app.get('/api/contacts', (_req, res) => {
  res.json(db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all());
});

/* ----------------------------- stats ------------------------------- */

app.get('/api/stats', (_req, res) => {
  res.json({
    events: db.prepare('SELECT COUNT(*) AS n FROM events').get().n,
    registrations: db.prepare('SELECT COUNT(*) AS n FROM registrations').get().n,
    messages: db.prepare('SELECT COUNT(*) AS n FROM messages').get().n
  });
});

app.listen(PORT, () => {
  console.log(`CampusConnect running at http://localhost:${PORT}`);
});
