# CycleLog

A full-stack menstrual cycle tracker. Log daily symptoms and moods, and the app figures out the rest — detecting when cycles start and end, surfacing patterns across cycles, and predicting the next one.

**🔗 Live demo: [cyclelog-ri6c.onrender.com](https://cyclelog-ri6c.onrender.com)**

> Try it with the demo account — **username `tester`, password `test123`** — which is pre-loaded with four months of data so the charts and predictions have something to work with.
>
> *Hosted on a free tier, so the first request after a period of inactivity takes ~50 seconds to wake the server. Subsequent loads are instant.*

**Dashboard** — current cycle day, next-cycle prediction, what to expect today, and a quick-log panel for any of the last few days.

![CycleLog dashboard showing an active cycle on day 4, a next-cycle prediction, and the quick log panel](docs/dashboard.png)

**History** — flow statistics, most common symptoms and moods, and a breakdown of which symptoms occur on which cycle day. Scopeable to all time, one cycle, a month, or a year.

![CycleLog statistics view with cycle stats and symptom and mood charts](docs/history.png)

**Calendar** — cycle and mood views, with a side panel showing any day's full detail.

![CycleLog calendar with per-day mood dots and a day detail panel](docs/calendar.png)

---

## Features

**Daily logging** — Pick a day and record flow, moods, symptoms, and notes. Symptoms come from a catalog of 20 grouped by body system, each with severity and its own detail fields (headache side, acne location and type, appetite direction, and so on). Moods are picked from a tiered menu of 22 emotions, multi-select across tiers, because feeling both *stressed* and *lazy* on the same day is normal.

**Cycles detect themselves** — There's no "start a cycle" button. Logging flow starts a cycle automatically; a cycle ends on its own after three days without flow, backdated to the last day flow was actually recorded. Logging flow a day or two *before* an existing cycle's start extends that cycle backward instead of creating a spurious new one.

**Statistics** — Flow length averages, most common symptoms and moods, and a stacked breakdown of which symptoms occur on which cycle day. Every view can be scoped to all time, a single cycle, a month, or a year.

**Prediction** — Estimates the next cycle from the average interval between past cycle starts, falling back to a user-supplied typical length when there isn't enough history. It also computes per-day likelihoods — "cramps occurred on Day 1 in 3 of 4 cycles" — shown as a compact "what to expect" summary on the dashboard and a full day-by-day table in the statistics view.

**Calendar** — Month view with a cycle-log mode and a mood mode (color-coded dots), plus a side panel showing any day's full details.

**Accounts** — Signup and login with per-user data isolation.

---

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, Vite, React Router, Tailwind CSS, Recharts |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL with Prisma ORM (8 migrations) |
| Auth | JSON Web Tokens in httpOnly cookies, bcrypt password hashing |
| Hosting | Render (single service) + Neon (Postgres) |

---

## Notes on the design

A few decisions that shaped the codebase:

**Pure functions for all analysis.** `stats.js` and `prediction.js` contain no React and no data fetching — they're plain functions taking `(cycles, symptoms)` and returning numbers. Pages fetch data and render; the math lives on its own. This made statistics testable in isolation and shared between pages, and it meant adding the filtering feature (all time / by cycle / by month / by year) required *zero* changes to the statistics functions themselves — filtering just picks which arrays get passed in.

**Symptoms as rows, not columns.** Symptoms started as fixed database columns (`cramps`, `fatigue`, …), which meant every new symptom required a migration. They're now rows in a `SymptomEntry` child table keyed by a catalog entry, with severity and a flexible JSON `details` field. Adding a symptom is now a one-line change to a single config file — no schema change, and it automatically appears in the checklist, the charts, and the history.

**The server never trusts the client for identity.** Every data route derives the user from the verified JWT (`req.userId`), never from the request body. Routes taking an `:id` additionally verify ownership before acting, so a logged-in user can't reach another user's records by guessing an id — the IDOR case that per-user list filtering alone doesn't cover.

**One origin in production.** Express serves both the API and the compiled React app. Splitting them across domains would make the auth cookie third-party — blocked by default in Safari and being phased out in Chrome — so a same-origin deployment keeps login reliable and removes CORS entirely.

**Cycle staleness is evaluated lazily.** Rather than running a scheduled job to close finished cycles, the check runs whenever cycles are read or a log is saved. It runs *before* the incoming log is written — otherwise a new period's first flow entry would make a months-old cycle look freshly active and silently merge two periods into one.

---

## Running locally

**Prerequisites:** Node.js 18+ and a local PostgreSQL server.

```bash
git clone https://github.com/linaryi/CycleLog.git
cd CycleLog
```

**1. Create the database**

```bash
createdb cyclelog
```

**2. Set up the server**

```bash
cd server
npm install
```

Create `server/.env`:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/cyclelog"
JWT_SECRET="paste-a-long-random-string-here"
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Apply the migrations and start the API (port 3000):

```bash
npx prisma migrate deploy
npm run dev
```

**3. Set up the client** — in a second terminal:

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173** and sign up.

**Optional — load demo data:**

```bash
cd server
node scripts/seedDemo.js
```

Creates a `tester` / `test123` account with four months of generated cycles, symptoms, and moods. Safe to re-run; it only touches that account.

---

## Project structure

```
client/
  src/
    pages/          Dashboard, LogEntry, History, Calendar, Medication, AuthForm
    components/     SymptomChecklist, MoodPicker, DaySummary, Navbar, Toast
    stats.js        statistics (pure functions)
    prediction.js   cycle prediction (pure functions)
    symptomCatalog.js / moodCatalog.js   the symptom and mood definitions
    api.js          fetch wrapper (sends the auth cookie, handles errors)
    AuthContext.jsx session state
server/
  index.js          Express app: auth, cycles, symptoms, medications
  prisma/           schema and migrations
  scripts/          demo data seeder
```
