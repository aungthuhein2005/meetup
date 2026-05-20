# MeetToTalk — web app

This is the Vite + React + TypeScript + Tailwind front-end. For setup, features, routes, Firebase/Gemini configuration, and deployment instructions, see the **[root README](../README.md)**.

## Quick reference

```bash
cp .env.example .env   # fill in Firebase + optional Gemini / Maps keys
npm install
npm run dev            # http://localhost:5173
```

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server (`predev` checks core dependencies exist) |
| `npm run build` | Typecheck + production bundle |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |

### Project structure

```
src/
  components/      # Reusable UI (AppShell, MeetupCard, MeetupPlaceMap, MyTicketCard, …)
  context/         # AuthContext
  lib/             # Firebase init
  pages/           # Route components (LandingPage, HomePage, MeetupDetailPage, …)
  services/        # Firestore + Gemini service layer
  types/           # Shared TS models
  utils/           # Geo, maps URLs, meetup status, share helpers
firebase/          # Firestore rules + indexes (deploy with `firebase deploy --only firestore`)
```
