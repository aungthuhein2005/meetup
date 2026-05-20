# MeetToTalk

Location-aware web app for coordinating real-world meetups: discover events around you, share them with one link, run a smooth event with optional tickets, and get Gemini-powered recommendations and chat. Product context lives in `[docs/PRD.md](docs/PRD.md)`.

## Features

**Discovery**

- Public marketing landing at `/` with auth-aware CTAs and animated hero.
- Nearby feed (`/home`) filtered by your saved radius, plus a "For you" section showing every active meetup with AI picks bubbled to the top.
- Live header search with debounced URL state (`?q=…`) across title, tags, place, and description.
- Status badges on every card: **Live now / Upcoming / Ended**, with ended events demoted to the bottom of lists.

**Hosting & joining**

- Create a meetup in under a minute, with optional **live location** sharing during the event window.
- **Optional ticketing** — issue scannable QR codes per participant for organized events, or turn it off for casual hangouts (no tickets needed).
- Organizer **check-in modal**: paste a code or use the in-browser camera scanner (BarcodeDetector with fallback).
- Participants can **leave** events; organizers see real-time RSVP and check-in counts.

**Maps & directions**

- Interactive Google Map on the meetup detail page showing the event venue and your live position with a one-tap "Open Maps" launch.

**My events**

- `/me` page with a live-updating **countdown card** for your next upcoming or live event, plus Hosting / Joined / Past sections.

**Sharing**

- Every meetup has a public landing page at `/m/:id` — anyone can preview the event without signing in. Joining triggers a login redirect that brings users back to the same meetup.
- Built-in share card with QR code + copy / native share buttons.

**Other**

- Email/password auth with **forgot password** flow.
- Onboarding capture for interests, saved location, and radius.
- Demo seeder at `/dev/seed` (logged-in only) creates 8 mock meetups for quick demos.

## Repository layout


| Path          | Description                                                           |
| ------------- | --------------------------------------------------------------------- |
| `web-app/`    | Vite + React + TypeScript + Tailwind, Firebase Auth/Firestore, Gemini |
| `docs/PRD.md` | Product requirements                                                  |


## Routes


| Path               | Auth             | Purpose                                                                    |
| ------------------ | ---------------- | -------------------------------------------------------------------------- |
| `/`                | public           | Marketing landing page (works for guests and logged-in users).             |
| `/login`           | public           | Sign in / register (accepts `state.mode = 'up'` to open the Register tab). |
| `/forgot-password` | public           | Password reset request.                                                    |
| `/m/:id`           | public           | Public meetup landing for sharing — no auth required to view.              |
| `/onboarding`      | auth             | First-run profile setup (interests, location, radius).                     |
| `/home`            | auth + onboarded | Nearby feed + "For you" all-meetups list.                                  |
| `/me`              | auth + onboarded | My events: live countdown, Hosting / Joined / Past.                        |
| `/meetups/new`     | auth + onboarded | Create a meetup.                                                           |
| `/meetups/:id`     | auth + onboarded | Meetup detail: map, ticket, check-in, live location, share.                |
| `/assistant`       | auth + onboarded | Gemini-backed chat assistant.                                              |
| `/dev/seed`        | auth + onboarded | Hidden seeder — creates 8 demo meetups around your saved location.         |


## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** (or compatible client; `web-app` ships with `.npmrc` using `legacy-peer-deps` for smoother installs)
- Enough **free disk space** for `node_modules` and the npm cache (Firebase SDK is large; low disk space causes `ENOSPC` during `npm install`)

## Quick start

```bash
cd web-app
cp .env.example .env
```

Edit `.env` with your Firebase web app keys from [Firebase Console](https://console.firebase.google.com/) → Project settings. Optionally set:

- `VITE_GEMINI_API_KEY` (and `VITE_GEMINI_MODEL` to override the default `gemini-2.5-flash`) — enables AI picks and the assistant.
- `VITE_GOOGLE_MAPS_API_KEY` — enables the interactive map on the meetup detail page (enable **Maps JavaScript API** in Google Cloud).
- `VITE_APP_URL` — base URL the share QR encodes. For on-stage demos, set this to your machine's LAN URL (e.g. `http://192.168.1.10:5173`) so phones on the same Wi-Fi can open the meetup link.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Demo data

After signing in and completing onboarding, visit `http://localhost:5173/dev/seed` and click **Seed 8 demo meetups**. You'll get a mix of live, upcoming, and ended events (ticketed and casual) scattered around your saved location, perfect for screenshots and live demos.

## Firebase setup

1. **Authentication** — Enable **Email/Password** under Authentication → Sign-in method. If you see `auth/configuration-not-found`, this step was missed.
2. **Firestore** — Create a database (production mode recommended). Paste rules from `web-app/firebase/firestore.rules` into Firestore → Rules and publish. The rules cover:
  - `meetups/{id}` — public read (so `/m/:id` works without auth), authed writes.
  - `meetups/{id}/participants/{uid}` — per-participant tickets; participant can create / delete their own pass, organizer can read all and flip check-in.
  - `meetups/{id}/live/{uid}` — opt-in live location during the event window.
3. **Project link** — Run `firebase login`, `cd web-app`, `firebase use --add` (alias `default` is fine), then:
  ```bash
   firebase deploy --only firestore
  ```
   That deploys rules and indexes from `web-app/firebase.json` and `web-app/firebase/`.

## Gemini (AI picks and assistant)

- Create an API key in [Google AI Studio](https://aistudio.google.com/apikey) and set `VITE_GEMINI_API_KEY` in `web-app/.env`.
- Default model in code is `**gemini-2.5-flash**`. Override with `VITE_GEMINI_MODEL` if Google renames or deprecates models; see [Gemini models](https://ai.google.dev/gemini-api/docs/models/gemini).
- Calls use exponential-backoff retries for `503` / `429` so transient high-demand failures don't break the UX.

For production, prefer calling Gemini from a **trusted backend** instead of exposing the key in the browser.

## Deployment (Vercel)

Vercel project settings:


| Field            | Value           |
| ---------------- | --------------- |
| Framework Preset | **Vite**        |
| Root Directory   | `web-app`       |
| Build Command    | `npm run build` |
| Output Directory | `dist`          |
| Install Command  | `npm install`   |


Add a `web-app/vercel.json` with an SPA rewrite so deep links like `/m/:id` and `/meetups/:id` don't 404 on hard refresh:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Then add **environment variables** under Project Settings → Environment Variables. Every `VITE_*` key from `.env.example` needs to be set, with `VITE_APP_URL` pointed at the Vercel domain (e.g. `https://your-app.vercel.app`).

Don't forget:

- **Firebase Auth → Settings → Authorized domains** — add your Vercel domain or sign-in will fail.
- **Google Cloud Console → API key restrictions** — restrict the Maps key to your production domain.

## Scripts (`web-app`)


| Command           | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| `npm run dev`     | Local dev server (`predev` checks core dependencies exist) |
| `npm run build`   | Typecheck + production bundle                              |
| `npm run preview` | Serve the production build locally                         |
| `npm run lint`    | ESLint                                                     |


## Troubleshooting

- `**Failed to resolve import "firebase/..."`** — Run `npm install` inside `web-app` and ensure the install completes (no `ENOSPC`).
- **Firestore "query requires an index"** — The app's meetup feed uses `orderBy('createdAt')` and filters `active` in the client to avoid a composite index; if you change queries, use the console link Firebase provides or deploy `firebase/firestore.indexes.json`.
- **Gemini `404` / model not found** — Update `VITE_GEMINI_MODEL` to a current model id from Google's docs.
- **Map doesn't render** — Confirm `VITE_GOOGLE_MAPS_API_KEY` is set in `.env` (not just `.env.example`), the **Maps JavaScript API** is enabled in Google Cloud, and the dev server has been restarted since changing `.env`.
- **QR scan from phone shows `localhost`** — Set `VITE_APP_URL` to your LAN URL (e.g. `http://192.168.1.10:5173`) and restart the dev server.
- `**This meetup could not be found` after scanning a QR** — Your Firestore rules are still blocking public reads; deploy the latest `web-app/firebase/firestore.rules` which allows public reads on `meetups/{id}`.
- `**.env` keeps showing up in `git status`** — It was committed in the past so git keeps tracking it. Run `git rm --cached web-app/.env` and commit. Rotate any keys that lived in old commits if the repo is public.

