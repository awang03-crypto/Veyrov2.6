# Veyro Phase 1 Foundation

## Current Deployment Shape

- The React app is the public website at `/`.
- `vite.config.js` uses `base: "/"`.
- `react/src/App.jsx` uses a root `BrowserRouter`.
- `server.js` serves the React build first and redirects old `.html` URLs into React routes.

This makes React the single public entrypoint while keeping old public URLs working through redirects.

## Launch Plans

- Free: $0/month, soccer calculator, 5 saved matches, basic vault and notes.
- Coach: $9/month, unlimited saved matches, team code, roster management, coach dashboard, team trends.
- Premium: $19/month, everything in Coach, Video AI analysis, exports, premium reports.

The canonical plan data lives in `lib/plans.js` and is exposed at `GET /api/plans`.

Feature gate logic lives in `react/src/services/monetization.js`.

- Free users can save up to 5 matches.
- Coach users get team management and unlimited saved matches.
- Premium users get Coach features plus Video AI and exports.
- Admin users bypass feature gates.
- Firestore users can only create themselves as `free`; only the admin can change `planTier`, `planStatus`, and `planUpdatedAt`.

## Phase 1 Guardrails

- `npm run check` verifies `server.js` syntax.
- `npm test` verifies server basics plus foundation rules.
- `npm run build` verifies the React app builds for the public root.
- `.github/workflows/ci.yml` runs install, check, tests, and build on GitHub.

## Migration Rule

React owns the public website. Keep new product behavior in React components and keep old `.html` paths as redirects only.
