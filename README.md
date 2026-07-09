# Veyro: Soccer Player Performance Tracker

Veyro helps players, coaches, and parents track and rate soccer performance with a simple, intuitive rating calculator and data vault. Upload match footage and get AI-powered stat analysis with Gemini or TwelveLabs.

## Quick Start

### Prerequisites
- **Node.js 20+**
- **npm**
- **Firebase project** (free tier works)
- **Gemini API key** (for Video AI—optional but recommended)

### Install & Run Locally

```bash
# Clone and install
git clone https://github.com/awang03-crypto/Veyrov2.6.git
cd Veyrov2.6
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Firebase and Gemini API keys

# Start the app
npm start
# Open http://localhost:3000
```

The app runs on **http://localhost:3000** with:
- React SPA frontend on port 3000
- Express backend at `localhost:3000/api`
- Video AI endpoints ready to use

### Build for Production

```bash
# Build the React app
npm run build

# Start server (serves built React app + backend API)
npm start
```

---

## How to Use Veyro

### For Players

1. **Open Veyro** → Sign in with email or Google
2. **Create a Match** → Pick sport, player, position, team colors
3. **Rate the Match** → Use the calculator to input stats (touches, passes, shots, etc.)
4. **Save to Vault** → Your ratings are saved and graphed over time
5. **View Progress** → See your average rating, trends, and player card
6. **(Premium) Upload Video** → Let AI auto-extract stats from match footage

### For Coaches

1. **Sign Up** → Create a free account
2. **Create a Team** → Give it a name and get a shareable team code
3. **Invite Players** → Share the code; players join your roster
4. **Track Team** → See all players' ratings, trends, and team average
5. **(Coach Plan) Team Dashboard** → Manage rosters, view analytics
6. **Download Reports** → Export team performance summaries

### For Parents

1. **Visit Parent Portal** → Sign in and find your child's profile
2. **Monitor Progress** → See match ratings, trends, and improvement areas
3. **Share Updates** → Download printable progress reports for family

---

## Features

### Calculator
- **Soccer-specific formula** that adjusts rating based on player position (goalkeeper, defender, midfielder, forward)
- Input stats: touches, passes, shots, goals, fouls, saves, etc.
- Instant 0–100 rating with explanations
- Works **offline** (syncs when online)

### Vault
- Save unlimited match records
- Graph performance over time (average, best, trend)
- Notes and coaching feedback per match
- Searchable by date, opponent, position

### Team Management (Coach Plan)
- Create and manage player rosters
- Shareable team invite links
- Team leaderboard and analytics
- Weekly performance reports

### Video AI Analysis (Premium)
- Upload match footage (MP4, MOV, AVI, WebM, MKV)
- AI extracts stats automatically (Gemini or TwelveLabs)
- Coach review mode: correct AI stats before saving
- Confidence scores on extracted stats
- Auto-generate highlight reels (coming soon)

### Player Cards
- Shareable trading-card style image: name, rating, position, strengths
- Perfect for social media
- Shows recent form and best match

---

## Environment Setup

### Required Variables

```env
# Firebase (get from Firebase Console)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_CLIENT_EMAIL=
VITE_FIREBASE_PRIVATE_KEY=

# Gemini (get from Google AI Studio)
GEMINI_API_KEY=

# Server
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
DIAGNOSTIC_API_KEY=your-long-random-secret-here

# Email notifications (optional)
SITE_NOTIFY_EMAIL=your-email@example.com
```

### Optional Variables

```env
# Alternative video AI providers
TWELVELABS_API_KEY=
CEREBRAS_API_KEY=
GROQ_API_KEY=

# OpenCV player tracking (advanced)
USE_OPENCV_TRACKER=false
TRACKER_PYTHON=python

# Billing (Stripe)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | Soccer calculator, 5 saved matches |
| **Coach** | $9/month | Unlimited matches, team management, roster tools |
| **Premium** | $19/month | Everything + Video AI analysis + exports |

---

## Development

### Run Tests

```bash
# Backend tests
npm test

# React component tests
npm run test:react

# All tests with coverage
npm run test:all

# View coverage report
npm run test:react:coverage
```

### Code Quality

```bash
# Syntax check
npm run check

# Lint
npm run lint

# Secret scan
npm run secret-scan

# Dependency audit
npm audit
```

### Frontend Development

```bash
# Hot-reload React dev server (optional)
cd react
npm run dev
# Opens http://localhost:5173
```

---

## Deployment

### Render (Recommended)

```bash
# Push to GitHub
git push origin main

# On Render.com:
# 1. Create new Web Service from GitHub repo
# 2. Build command: npm install
# 3. Start command: npm start
# 4. Add environment variables from .env.example
# 5. Deploy
```

### Hostinger

1. Build locally: `npm run build`
2. Upload entire folder (including `react/dist/`) via FTP
3. Set entry point to `server.js`
4. Node version: 20+
5. Add environment variables in dashboard

### Docker

```bash
# Build
npm run docker:build

# Run
npm run docker:run
```

---

## Architecture

```
Veyro/
├── server.js                 # Express server + API routes
├── lib/                      # Utilities (Firebase, billing, Video AI, etc.)
├── routes/                   # API endpoint handlers
├── firestore.rules           # Database security rules
├── react/                    # React SPA frontend
│   ├── src/
│   │   ├── pages/           # Full page components
│   │   ├── components/      # Reusable UI components
│   │   ├── services/        # Firebase & API clients
│   │   ├── App.jsx          # Router + main layout
│   └── dist/                # Built SPA (production)
├── tests/                    # Backend tests + React tests
└── .github/workflows/        # CI/CD (GitHub Actions)
```

**How it works:**
- Requests hit `server.js` (Express)
- Frontend served from `react/dist/` as static files
- API routes (`/api/*`) handle authentication, Video AI, billing
- Firebase handles user sessions and Firestore stores all data

---

## Key Pages

- **`/`** – Home / Soccer calculator
- **`/vault`** – Your saved matches
- **`/graph`** – Performance trends
- **`/analysis`** – Strengths, weaknesses, trends
- **`/team`** – Team management (Coach plan)
- **`/video`** – Upload & analyze match footage (Premium)
- **`/admin`** – Admin dashboard (staff only)
- **`/about`** – About Veyro
- **`/contact`** – Contact and feedback

---

## Video AI

### How It Works

1. **Upload** a match video (MP4, MOV, AVI, WebM, MKV)
2. **AI analyzes** the footage using Gemini or TwelveLabs
3. **Stats extracted**: touches, passes, shots, goals, fouls, etc.
4. **Coach review**: Correct any mistakes before saving
5. **Saved to vault**: Data synced with player profile

### Supported Providers

- **Gemini (default)** – Best accuracy, handles large videos (up to 2 GB)
- **TwelveLabs** – Fast, good for long matches
- **Fallback chain** – If one fails, tries the next automatically

### Limits

- Max video size: 1,900 MB (Gemini), 190 MB (TwelveLabs)
- Recommended: 1–15 min highlights or short clips
- Processing time: 2–10 minutes depending on length

---

## Troubleshooting

### "Cannot GET /"
**Problem:** React build not found.
**Solution:** Run `npm run build` and restart the server.

### Video AI returns no stats
**Problem:** API key missing or video format unsupported.
**Solution:** 
- Check `GEMINI_API_KEY` in `.env`
- Verify video is MP4, MOV, AVI, WebM, or MKV
- Try a shorter clip (under 10 min)

### Stuck on "Uploading 3 offline matches..."
**Problem:** Offline sync issues.
**Solution:** 
- Check your internet connection
- Refresh the page
- Clear IndexedDB: DevTools → Storage → IndexedDB → Clear

### Firebase errors ("Cannot find property...")
**Problem:** Firebase config is wrong.
**Solution:**
- Go to Firebase Console
- Download your config JSON
- Update `VITE_FIREBASE_*` variables in `.env`
- Restart server

### "Rate limit exceeded"
**Problem:** Too many API requests.
**Solution:**
- Wait a few minutes before retrying
- Upgrade to a paid plan (higher limits)
- Contact support if limits are too low for your use case

---

## Support & Feedback

- **Issues?** Open a GitHub issue
- **Feature request?** Create a discussion
- **Security issue?** Email awang03@dccs.org with details
- **General questions?** Check `DEPLOYMENT.md` for advanced setup

---

## License

Private. All rights reserved.

---

## What's Next?

- **Phase 2:** Coach onboarding flow, SEO content, mobile app
- **Phase 3:** Social features (player feed, leaderboards), gamification
- **Phase 4:** Recruiting pipeline, B2B league partnerships, AI coaching recommendations

See `DEPLOYMENT.md` for detailed deployment instructions and `DEVELOPMENT.md` for developer guides.

---

**Ready to track your soccer performance? [Sign up now →](https://darksalmon-lark-983637.hostingersite.com/)**
