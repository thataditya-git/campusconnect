# CampusConnect

A full-stack **campus events & workshops portal**. Students can browse, search and
register for events; clubs can publish their own events and track registrations from an
organizer dashboard.

Built for the **Web Technology Mini Project (ICT 3131)**, V Sem B.Tech.

---

## Tech stack

| Layer      | Technology                                             |
|------------|--------------------------------------------------------|
| Front end  | HTML5 (semantic), Bootstrap 5.3, vanilla JavaScript (ES6, `fetch`) |
| Back end   | Node.js, Express 4                                     |
| Database   | SQLite (via `better-sqlite3`)                          |
| Data format| JSON over HTTP (REST)                                  |

> Bootstrap is vendored locally in `public/vendor/` so the site runs with no CDN dependency.

---

## Features (6)

1. **Browse events with live search & category filter** — debounced keyword search + category dropdown.
2. **Event details & registration** — detail page with a validated registration modal, live capacity and duplicate checks.
3. **Host an event** — organizer form with client- and server-side validation.
4. **Organizer dashboard** — summary stats, manage/delete events, view & filter registrations.
5. **Contact form** — validated message form stored in the database.
6. **Accessible, themeable UI** — semantic landmarks, ARIA, keyboard focus, and a light/dark theme toggle (saved per user).

---

## Getting started

**Prerequisites:** Node.js 18 or newer.

```bash
# 1. install dependencies
npm install

# 2. start the server (creates + seeds the database on first run)
npm start

# 3. open the app
#    http://localhost:3000
```

To wipe and re-seed the database with the sample events:

```bash
npm run seed
```

---

## Project structure

```
campusconnect/
├── server.js            # Express app + REST API (with server-side validation)
├── db.js                # SQLite schema + seed data
├── data/                # SQLite database file (created at runtime, git-ignored)
├── public/              # front end (served as static files)
│   ├── index.html       # Events listing + search/filter      (Student 1)
│   ├── event.html       # Event detail + registration modal    (Student 1)
│   ├── host.html        # Host a new event                      (Student 2)
│   ├── admin.html       # Organizer dashboard                   (Student 2)
│   ├── about.html       # About the project                     (shared)
│   ├── contact.html     # Contact form                          (shared)
│   ├── css/styles.css   # shared theme (one design system)
│   ├── js/              # one script per page + common.js
│   ├── img/             # local placeholder image
│   └── vendor/          # Bootstrap 5 (vendored)
└── package.json
```

## REST API

| Method | Endpoint                      | Purpose                              |
|--------|-------------------------------|--------------------------------------|
| GET    | `/api/events`                 | List events (`?search=`, `?category=`) |
| GET    | `/api/events/:id`             | Single event                         |
| POST   | `/api/events`                 | Create an event                      |
| DELETE | `/api/events/:id`             | Delete an event                      |
| POST   | `/api/events/:id/register`    | Register for an event                |
| GET    | `/api/registrations`          | List registrations (`?event_id=`)    |
| POST   | `/api/contact`                | Submit a contact message             |
| GET    | `/api/stats`                  | Dashboard summary counts             |

## Division of work

| Student | Modules / Pages |
|---------|-----------------|
| Aditya Prakash (240911310) | Events listing (search & filter), Event detail & registration |
| Pranav Gaddam (240953548) | Host an event, Organizer dashboard |
| Shared  | Common layout/theme, About, Contact |

## License

MIT
