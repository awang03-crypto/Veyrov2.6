# Veyro

Veyro is a multi-sport match rating calculator and player performance tracker built for players, parents, and coaches. It helps a player turn one game into a clear rating, save the details, study trends, compare performances, and build a stronger picture of their development over time.

The app is a React single-page application built with Vite, with a Node/Express backend for protected API routes and experimental Video AI. Firebase powers authentication and Firestore data.

**Currently supported sports:**
- Soccer
- Basketball (admin-only)
- American football (admin-only)

## Core Features

- Live match rating out of 100
- Position-specific formulas for goalkeeper, defender, midfielder, and attacker (soccer)
- Saved match vault with opponent, date, score, result, minutes, notes, stats, and rating
- Rating graphs, trend charts, strengths, weaknesses, and recent form analysis
- Side-by-side saved game comparison
- Player profile and recruiting-style sharing tools
- Coach team creation, player approvals, roster views, and team tracking
- Email/password and Google sign-in
- Experimental Video AI workflow
- SEO pages, performance guide, sitemap, robots rules, and backlink outreach plan
- Private admin dashboard
- Private basketball prototype (admin-only)
- Private American football prototype (admin-only)
- React SPA routes for the full website

## Important React Routes

```text
/                                  Home, auth, tutorial, and soccer calculator
/vault                             Saved match vault, exports, and sharing
/graph                             Rating and stat trend graphs
/analysis                          Strengths, weaknesses, trends, and benchmarks
/compare                           Side-by-side saved game comparison
/team                              Player team page
/coach                             Coach dashboard and roster tools
/profile                           Private player profile
/recruiting                        Public recruiting profile
/video                             Experimental soccer Video AI
/admin                             Private admin dashboard

/about                             About Veyro
/contact                           Contact and feedback
/privacy                           Privacy policy
/for-coaches                       Coach-focused SEO page
/soccer-rating-calculator          SEO calculator page
/soccer-player-stats-tracker       SEO stats tracker page
/soccer-performance-guide          Link-worthy guide for players and coaches
/other-sports                      Other sports overview

/basketball                        Private admin basketball calculator
/basketball/*                      Private admin basketball tools

/football                          Private admin football calculator
/football/*                        Private admin football tools
```

## Project Structure

```text
server.js                  Express server, security headers, static hosting, API routes
firestore.rules            Firestore security rules
manifest.webmanifest       PWA manifest
sw.js                      Service worker
tracker_service.py         Optional OpenCV/YOLO tracker service
tracker_api.py             Optional tracker helper API
llms.txt                   AI/search summary
sitemap.xml                Search engine sitemap
robots.txt                 Crawler rules
backlink-outreach.md       Outreach copy and backlink ideas
DEPLOYMENT.md              Deployment instructions
VERCEL.md                  Vercel-specific deployment notes
render.yaml                Render platform configuration
vite.config.js             Vite configuration
requirements.txt           Python dependencies
requirements-tracker.txt   Python tracker dependencies
package.json               Node dependencies and scripts
package-lock.json          Locked Node dependencies

React app (react/):
  react/index.html         React app entry HTML
  react/src/
    App.jsx                Main app component
    main.jsx               React entry point
    components/            Reusable UI components (MobileNav, Sidebar, Toast)
    contexts/              React contexts (AuthContext)
    lib/                   Firebase configuration
    pages/                 Full set of page components:
      About.jsx, Admin.jsx, Analysis.jsx, Calculator.jsx, Coach.jsx,
      Compare.jsx, Contact.jsx, ForCoaches.jsx, Graph.jsx, OtherSports.jsx,
      Privacy.jsx, Profile.jsx, Recruiting.jsx, SoccerPerformanceGuide.jsx,
      SoccerPlayerStatsTracker.jsx, SoccerRatingCalculator.jsx, Team.jsx,
      Vault.jsx, VideoAI.jsx
    pages/basketball/      Basketball pages (Analysis, Calculator, Coach, Compare, Graph, Profile, Recruiting, Team, Vault, VideoAI)
    pages/football/        Football pages (Analysis, Calculator, Coach, Compare, Graph, Profile, Recruiting, Team, Vault, VideoAI)
    styles/                CSS module files
```

## Local Setup

Requirements:

- Node.js 20 or newer
- Firebase Authentication
- Firestore Database
- Email/password auth enabled
- Google auth enabled if using Google sign-in
- Optional AI provider keys for Video AI

Install and run (static HTML version):

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

Check syntax:

```bash
npm run check
```

### React SPA Version

```bash
cd react
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

Build the React app for production:

```bash
cd react
npm run build
```

## Environment Variables

Keep real keys in `.env` locally and in your host's private environment settings in production.

```env
PORT=3000
ALLOWED_ORIGINS=https://your-site.example.com,http://localhost:3000
DIAGNOSTIC_API_KEY=
EXPOSE_DEBUG_ERRORS=false

GEMINI_API_KEY=
GEMINI_API_KEYS=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_USE_AUDIT=false

TWELVELABS_API_KEY=
TWELVELABS_MODEL=pegasus1.5
TWELVELABS_MAX_MB=190
TWELVELABS_TIMEOUT_MS=120000

CEREBRAS_API_KEY=
CEREBRAS_MODEL=gpt-oss-120b
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
FAST_TEXT_PROVIDER=cerebras

VIDEO_AI_RATE_LIMIT=8
CORRECTION_RATE_LIMIT=20
NOTIFICATION_RATE_LIMIT=30
MAX_VIDEO_MB=1900

USE_OPENCV_TRACKER=false
TRACKER_SERVICE_URL=
TRACKER_PYTHON=python
TRACKER_TIMEOUT_MS=180000
REMOTE_TRACKER_TIMEOUT_MS=45000
TRACKER_REMOTE_MAX_MB=250

SITE_NOTIFY_EMAIL=you@example.com
SITE_NOTIFY_BACKEND_EMAIL=false
```

Production notes:

- Keep `ALLOWED_ORIGINS` limited to the live site and local dev.
- Keep `EXPOSE_DEBUG_ERRORS=false`.
- Use a long random value for `DIAGNOSTIC_API_KEY` if diagnostics are enabled.
- Never commit `.env` or API keys.

## Firebase

Enable:

- Authentication
- Email/password sign-in
- Google sign-in
- Firestore Database

After editing Firestore rules, publish:

```text
firestore.rules
```

Main collections:

```text
users
ratings
teams
teamMembers
teamJoinRequests
publicPlayerStats
siteEvents
feedbackMessages
basketballRatings
footballRatings
```

## Sports

### Soccer (Public)
The primary sport. Full calculator, vault, graphs, analysis, comparison, recruiting, and coach tools available to all users.

### Basketball (Admin-Only)
Private basketball prototype with its own calculator, vault, graphs, analysis, comparison, profile, team, recruiting, and video AI pages. Noindexed from search engines.

### Football (Admin-Only)
Private American football prototype with its own calculator, vault, graphs, analysis, comparison, profile, team, recruiting, and video AI pages. Noindexed from search engines.

## SEO

Veyro includes indexable pages for soccer rating and tracking searches:

- `soccer-rating-calculator.html`
- `soccer-player-stats-tracker.html`
- `for-coaches.html`
- `soccer-performance-guide.html`

The best backlink target is:

```text
https://darksalmon-lark-983637.hostingersite.com/soccer-performance-guide.html
```

After deployment:

- Submit `sitemap.xml` in Google Search Console.
- Confirm the live `robots.txt` is current.
- Share the performance guide with coaches, clubs, parents, and local soccer sites.
- Use `backlink-outreach.md` for outreach email drafts and backlink ideas.

## Deployment

Deploy Veyro as a Node/Express app because `server.js` powers backend routes and protects AI keys.

Recommended settings:

```text
Runtime: Node.js 20+
Install command: npm install
Start command: npm start
Entry file: server.js
```

For the React SPA, build first and serve the static files from the Express server:

```bash
cd react && npm install && npm run build
```

Platform-specific files are provided:
- `render.yaml` — Render.com deployment configuration
- `VERCEL.md` — Vercel deployment notes
- `DEPLOYMENT.md` — General deployment instructions

Do not upload or commit:

```text
node_modules/
.env
uploads/
data/
*.zip
*.log
*.jsonl
```

## Video AI

Video AI is experimental. Generated stats should be reviewed before saving.

Supported backend options:

- Gemini for video/stat analysis
- TwelveLabs as an alternate video provider
- Cerebras or Groq for fast text cleanup
- Optional OpenCV/YOLO tracking context

Shorter, clearer clips produce better results than full-match uploads.

## Security Checklist

- Keep `.env` private.
- Keep API keys out of source code.
- Restrict `ALLOWED_ORIGINS`.
- Keep `EXPOSE_DEBUG_ERRORS=false` in production.
- Publish updated `firestore.rules` after rule changes.
- Keep `uploads`, `data`, `.git`, and config files out of public hosting.
- Rotate any key that was ever pasted into chat, source code, or public files.
- Keep Firebase authorized domains updated.
- Keep private basketball, football, and admin pages `noindex`.

## Useful Commands

```bash
npm start
npm run check
npm audit --omit=dev --audit-level=high
```

## Status

Veyro currently supports the full player workflow (soccer), coach team workflow, public recruiting profiles, SEO pages, security hardening, and experimental Video AI. Basketball and American football are available as admin-only prototypes. A React SPA version is under development alongside the static HTML version. The main future improvements are better Video AI accuracy, smoother coach onboarding, more shareable public profiles, and stronger backlink outreach.
