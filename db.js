/**
 * db.js  —  Database layer for CampusConnect
 * ------------------------------------------------------------
 * Uses better-sqlite3 (a file-based SQL database). On first run
 * it creates the schema and seeds a few sample events so the
 * site is not empty during the demo.
 *
 * Exposes a single `db` object (a better-sqlite3 Database) plus
 * helper init/seed functions used by server.js.
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'campusconnect.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT    NOT NULL,
      category     TEXT    NOT NULL,
      description  TEXT    NOT NULL,
      venue        TEXT    NOT NULL,
      date         TEXT    NOT NULL,          -- ISO date (YYYY-MM-DD)
      capacity     INTEGER NOT NULL,
      organizer    TEXT    NOT NULL,
      image        TEXT,                       -- image URL
      created_at   TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id     INTEGER NOT NULL,
      name         TEXT    NOT NULL,
      email        TEXT    NOT NULL,
      reg_no       TEXT    NOT NULL,
      year         INTEGER NOT NULL,
      created_at   TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      email        TEXT    NOT NULL,
      subject      TEXT    NOT NULL,
      body         TEXT    NOT NULL,
      created_at   TEXT    DEFAULT (datetime('now'))
    );
  `);
}

function seed() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM events').get().n;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO events (title, category, description, venue, date, capacity, organizer, image)
    VALUES (@title, @category, @description, @venue, @date, @capacity, @organizer, @image)
  `);

  const sample = [
    {
      title: 'Intro to Generative AI Workshop',
      category: 'Workshop',
      description: 'A hands-on session covering large language models, prompt engineering and building your first RAG pipeline. Laptops required.',
      venue: 'AB-5 Seminar Hall, MIT',
      date: '2026-11-18',
      capacity: 80,
      organizer: 'IEEE Student Branch',
      image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=60'
    },
    {
      title: 'Manipal Hackathon 2026',
      category: 'Hackathon',
      description: '24-hour inter-college hackathon. Form teams of up to four and build something that matters. Cash prizes and internship offers for winners.',
      venue: 'Innovation Centre',
      date: '2026-11-29',
      capacity: 200,
      organizer: 'Technical Council',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=60'
    },
    {
      title: 'Cultural Night: Rhythm',
      category: 'Cultural',
      description: 'An evening of music, dance and drama performances by student clubs. Open to all. Free entry with student ID.',
      venue: 'Open Air Theatre',
      date: '2026-12-05',
      capacity: 500,
      organizer: 'Cultural Committee',
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=60'
    },
    {
      title: 'Career Talk: Breaking into Product',
      category: 'Seminar',
      description: 'Alumni working as product managers share how they transitioned from engineering and what skills matter early in your career.',
      venue: 'NLH Auditorium',
      date: '2026-11-22',
      capacity: 150,
      organizer: 'Placement Cell',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=60'
    },
    {
      title: 'Robotics Build Weekend',
      category: 'Workshop',
      description: 'Learn to design, assemble and program a line-following robot over two days. Kits provided; beginners welcome.',
      venue: 'Robotics Lab',
      date: '2026-12-13',
      capacity: 40,
      organizer: 'Robotics Club',
      image: 'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?auto=format&fit=crop&w=800&q=60'
    },
    {
      title: 'Open Mic & Poetry Slam',
      category: 'Cultural',
      description: 'Share your poetry, stand-up or acoustic set in a friendly space. Sign-up slots are limited, so register early.',
      venue: 'Student Plaza Cafe',
      date: '2026-11-26',
      capacity: 60,
      organizer: 'Literary Club',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=60'
    }
  ];

  const tx = db.transaction((rows) => rows.forEach((r) => insert.run(r)));
  tx(sample);
  console.log(`[db] Seeded ${sample.length} sample events.`);
}

// Allow `node db.js --reseed` to wipe and re-seed.
if (require.main === module && process.argv.includes('--reseed')) {
  db.exec('DROP TABLE IF EXISTS registrations; DROP TABLE IF EXISTS events; DROP TABLE IF EXISTS messages;');
  init();
  seed();
  console.log('[db] Database reset and re-seeded.');
}

module.exports = { db, init, seed };
