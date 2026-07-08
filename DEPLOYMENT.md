# Veyro Deployment

This app is now a Node/Express app because `server.js` powers the Gemini video analysis backend. Deploy it as a Node web app, not as a static-only website.

## Hostinger

1. **Build locally first** before uploading:
   ```
   npm install
   npm run build
   ```
   This creates the `react/dist/` folder the server needs to serve the frontend.

2. Upload the entire project folder (including `react/dist/`) to Hostinger via the File Manager or FTP.

3. In Hostinger's Node.js settings:
   - Entry point: `server.js`
   - Node version: 20 or newer
   - The `start` script (`npm start`) will auto-rebuild on each restart as a safety net, but you should always upload a pre-built `react/dist/` folder.

4. Add all environment variables listed below under "Environment Variables".

> **Important:** If you see `Cannot GET /`, it means `react/dist/index.html` is missing. Run `npm run build` locally and re-upload the `react/dist/` folder.


## Recommended: Render

1. Push this folder to a GitHub repository.
2. Go to Render and create a new Web Service from that repository.
3. Use these settings:
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
   - Node version: 20 or newer
4. Add environment variables:
   - `GEMINI_API_KEY`: your Gemini API key
   - `GEMINI_API_KEYS`: optional comma-separated backup Gemini keys
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `CEREBRAS_API_KEY`: optional key for fast text-only correction lessons and JSON cleanup
   - `CEREBRAS_MODEL`: `gpt-oss-120b`
   - `GROQ_API_KEY`: optional key for fast text fallback
   - `GROQ_MODEL`: `llama-3.1-8b-instant`
   - `FAST_TEXT_PROVIDER`: `cerebras`
   - `TWELVELABS_API_KEY`: optional key for TwelveLabs-first video analysis
   - `TWELVELABS_MODEL`: `pegasus1.5`
   - `TWELVELABS_MAX_MB`: `190`
   - `TWELVELABS_TIMEOUT_MS`: `120000`
  - `MAX_VIDEO_MB`: `1900`
  - `ALLOWED_ORIGINS`: your production URL and local dev URL, for example `https://darksalmon-lark-983637.hostingersite.com,http://localhost:3000`
  - `DIAGNOSTIC_API_KEY`: a long random secret, not a website URL
  - `EXPOSE_DEBUG_ERRORS`: `false`
  - `GENERAL_API_RATE_LIMIT`: `120`
  - `VIDEO_AI_RATE_LIMIT`: `8`
  - `CORRECTION_RATE_LIMIT`: `20`
  - `NOTIFICATION_RATE_LIMIT`: `30`
  - `GEMINI_USE_AUDIT`: `false`
  - `USE_OPENCV_TRACKER`: `false`
  - `TRACKER_SERVICE_URL`: leave blank unless you have a separate tracker service
5. Deploy.
6. Open the Render URL. The app should load from `/index.html`, and Video AI should call the same deployed backend automatically.

## Hostinger

Use Hostinger's Node.js Web App feature only if your plan supports Node.js apps. Static hosting is not enough for Video AI because static hosting cannot run `server.js` or protect `GEMINI_API_KEY`.

Hostinger settings:

- Framework/type: Express.js or Other
- Install command: `npm install`
- Start command: `npm start`
- Entry file: `server.js`
- Node version: 20 or newer
- Environment variables: same as above

## Optional OpenCV/YOLO Tracker

The app now includes an optional Python tracker in `tracker_service.py`. It can detect players with YOLO, build simple tracklets, and send that tracking context into Gemini.

This is off by default because many cheap Node hosts do not support Python/OpenCV well. To enable it on a server that supports Python:

1. Install the Python packages:
   - `pip install -r requirements-tracker.txt`
2. Add environment variables:
   - `USE_OPENCV_TRACKER`: `true`
   - `TRACKER_PYTHON`: `python` or the full Python path
   - `TRACKER_SAMPLE_FPS`: `1`
   - `TRACKER_MAX_FRAMES`: `360`
   - `TRACKER_TIMEOUT_MS`: `180000`
3. Restart the Node app.
4. Test `/api/tracker-health`.

If `/api/tracker-health` says the tracker is not ready, keep `USE_OPENCV_TRACKER=false`. The Gemini-only video analysis will still work.

If the OpenCV tracker is deployed separately on Render, keep Hostinger as the Node/Gemini app and add:

- `USE_OPENCV_TRACKER`: `true`
- `TRACKER_SERVICE_URL`: your Render tracker URL, for example `https://rendermrating.onrender.com`
- `REMOTE_TRACKER_TIMEOUT_MS`: `45000`
- `TRACKER_REMOTE_MAX_MB`: `250`

Then restart the Hostinger Node app and test `/api/tracker-health`. It should proxy the Render `/health` result.

For best reliability, use 1-3 minute clips with the remote OpenCV tracker. Larger videos can still go to Gemini, but the tracker bridge skips videos over `TRACKER_REMOTE_MAX_MB` so Hostinger does not run out of memory or time out.

## Important Limits

Gemini media uploads are limited to about 2 GB, so production `MAX_VIDEO_MB` is set to `1900`. For best results, upload shorter clips instead of full matches.

Never upload `.env`, `node_modules`, or `uploads` to hosting manually. They are intentionally ignored by `.gitignore`.

## Security Checklist

- Publish the latest `firestore.rules` in Firebase after every rules change.
- Keep `EXPOSE_DEBUG_ERRORS=false` in production so AI/provider errors do not leak to visitors.
- Use a long random `DIAGNOSTIC_API_KEY`; do not use your site URL as the value.
- Keep `ALLOWED_ORIGINS` limited to your real production domain and `http://localhost:3000` for local testing.
- Do not upload `.env`, `uploads`, `data`, `node_modules`, or zip backups into the public web root.
