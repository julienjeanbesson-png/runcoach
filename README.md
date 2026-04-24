# RunCoach

RunCoach is a mobile-first personal running coach MVP built with deterministic training rules and local browser storage. It helps you plan weekly training, log workouts, and adapt safely without any backend or paid AI services.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lightweight shadcn-style UI primitives
- `localStorage` for persistence

## Local Setup

```bash
npm install
npm run dev
```

For a production check:

```bash
npm run build
npm run start
```

## Deployment

RunCoach is ready for free deployment on Vercel as a simple Next.js app. Connect the repository to Vercel, keep the default build settings, and deploy with the included `build` script.

## Notes

- All data stays in the browser in v1.
- No backend, auth, payment, or external API is required.
- The training plan is deterministic and rule-based.
