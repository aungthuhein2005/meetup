# MeetToTalk

Location-aware web app for coordinating real-world meetups: create and join events, optional live location during events, and Gemini-powered recommendations and chat. Product context lives in [`docs/PRD.md`](docs/PRD.md).

## Repository layout

| Path | Description |
|------|-------------|
| `web-app/` | Vite + React + TypeScript + Tailwind, Firebase Auth/Firestore, Gemini |
| `docs/PRD.md` | Product requirements |

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** (or compatible client; `web-app` ships with `.npmrc` using `legacy-peer-deps` for smoother installs)
- Enough **free disk space** for `node_modules` and the npm cache (Firebase SDK is large; low disk space causes `ENOSPC` during `npm install`)

## Quick start

```bash
cd web-app
cp .env.example .env
```

Edit `.env` with your Firebase web app keys from [Firebase Console](https://console.firebase.google.com/) → Project settings. Optionally set `VITE_GEMINI_API_KEY` and `VITE_GOOGLE_MAPS_API_KEY` (interactive map on meetup detail; enable **Maps JavaScript API** in Google Cloud). For on-stage QR demos, set `VITE_APP_URL` to your machine’s LAN URL (e.g. `http://192.168.1.10:5173`) so phones on the same Wi‑Fi open the correct meetup link.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Firebase setup

1. **Authentication** — Enable **Email/Password** under Authentication → Sign-in method. If you see `auth/configuration-not-found`, this step was missed.
2. **Firestore** — Create a database (production mode recommended). Paste rules from `web-app/firebase/firestore.rules` into Firestore → Rules and publish.
3. **Project link** — Run `firebase login`, `cd web-app`, `firebase use --add` (alias `default` is fine), then:

   ```bash
   firebase deploy --only firestore
   ```

   That deploys rules and indexes from `web-app/firebase.json` and `web-app/firebase/`.

## Gemini (AI picks and assistant)

- Create an API key in [Google AI Studio](https://aistudio.google.com/apikey) and set `VITE_GEMINI_API_KEY` in `web-app/.env`.
- Default model in code is **`gemini-2.5-flash`**. Override with `VITE_GEMINI_MODEL` if Google renames or deprecates models; see [Gemini models](https://ai.google.dev/gemini-api/docs/models/gemini).

For production, prefer calling Gemini from a **trusted backend** instead of exposing the key in the browser.

## Scripts (`web-app`)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server (`predev` checks core dependencies exist) |
| `npm run build` | Typecheck + production bundle |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |

## Troubleshooting

- **`Failed to resolve import "firebase/..."`** — Run `npm install` inside `web-app` and ensure the install completes (no `ENOSPC`).
- **Firestore “query requires an index”** — The app’s meetup feed uses `orderBy('createdAt')` and filters `active` in the client to avoid a composite index; if you change queries, use the console link Firebase provides or deploy `firebase/firestore.indexes.json`.
- **Gemini `404` / model not found** — Update `VITE_GEMINI_MODEL` to a current model id from Google’s docs.

## License

Private / unspecified — add a license file if you open-source the project.
