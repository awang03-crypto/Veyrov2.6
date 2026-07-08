import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "node:fs/promises";
import * as nodeFs from "node:fs";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { timingSafeEqual } from "node:crypto";
import { GoogleGenAI, createPartFromUri, createUserContent } from "@google/genai";
import Stripe from "stripe";
import createHealthRouter from "./routes/health.js";
import log from "./lib/log.js";
import { publicPlans } from "./lib/plans.js";
import { getAdminAuth, getAdminFirestore } from "./lib/firebase-admin.js";
import { applyStripePlanEvent } from "./lib/billing.js";
import { formatPrometheusMetrics } from "./lib/metrics.js";
import { bearerTokenFromHeader, canUseVideoAiEntitlement } from "./lib/entitlements.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
const dataDir = path.join(__dirname, "data");
const correctionsPath = path.join(dataDir, "video-corrections.jsonl");
const siteNotificationsPath = path.join(dataDir, "site-notifications.jsonl");
const securityEventsPath = path.join(dataDir, "security-events.jsonl");
const publicRobotsTxt = `User-agent: *
Allow: /

Disallow: /admin.html
Disallow: /basketball.html
Disallow: /basketball-vault.html
Disallow: /basketball-graph.html
Disallow: /basketball-analysis.html
Disallow: /basketball-compare.html
Disallow: /basketball-profile.html
Disallow: /basketball-team.html
Disallow: /basketball-coach.html
Disallow: /basketball-recruiting.html
Disallow: /basketball-video.html
Disallow: /football.html
Disallow: /football-vault.html
Disallow: /football-graph.html
Disallow: /football-analysis.html
Disallow: /football-compare.html
Disallow: /football-profile.html
Disallow: /football-team.html
Disallow: /football-coach.html
Disallow: /football-recruiting.html
Disallow: /football-video.html
Disallow: /profile.html
Disallow: /team.html
Disallow: /coach.html
Disallow: /recruiting.html
Disallow: /analysis.html
Disallow: /compare.html
Disallow: /graph.html
Disallow: /nextpage.html
Disallow: /video.html
Disallow: /api/
Disallow: /data/
Disallow: /uploads/
Disallow: /node_modules/
Disallow: /__pycache__/

Sitemap: https://darksalmon-lark-983637.hostingersite.com/sitemap.xml
`;
const publicSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://darksalmon-lark-983637.hostingersite.com/</loc>
    <lastmod>2026-06-10</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://darksalmon-lark-983637.hostingersite.com/og-image.svg</image:loc>
      <image:title>Veyro soccer performance tracker</image:title>
    </image:image>
  </url>
  <url>
    <loc>https://darksalmon-lark-983637.hostingersite.com/about.html</loc>
    <lastmod>2026-06-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://darksalmon-lark-983637.hostingersite.com/soccer-rating-calculator.html</loc>
    <lastmod>2026-06-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://darksalmon-lark-983637.hostingersite.com/soccer-player-stats-tracker.html</loc>
    <lastmod>2026-06-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://darksalmon-lark-983637.hostingersite.com/contact.html</loc>
    <lastmod>2026-06-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://darksalmon-lark-983637.hostingersite.com/for-coaches.html</loc>
    <lastmod>2026-06-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>
  <url>
    <loc>https://darksalmon-lark-983637.hostingersite.com/soccer-performance-guide.html</loc>
    <lastmod>2026-06-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://darksalmon-lark-983637.hostingersite.com/other-sports.html</loc>
    <lastmod>2026-06-12</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.55</priority>
  </url>
</urlset>
`;

function envNumber(name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
    const value = Number(process.env[name]);
    if (!Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, value));
}

if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
}

if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
}

const app = express();
const port = envNumber("PORT", 3000, { min: 1, max: 65535 });
const maxVideoMb = envNumber("MAX_VIDEO_MB", 1900, { min: 1, max: 4096 });
const apiJsonMaxBytes = envNumber("API_JSON_MAX_BYTES", 2 * 1024 * 1024, { min: 1024, max: 10 * 1024 * 1024 });
const securityEventsMaxBytes = envNumber("SECURITY_EVENTS_MAX_BYTES", 1024 * 1024, { min: 64 * 1024, max: 20 * 1024 * 1024 });
const securityEventsMaxLines = envNumber("SECURITY_EVENTS_MAX_LINES", 1000, { min: 100, max: 10000 });
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const geminiApiKeys = [
    process.env.GEMINI_API_KEY,
    ...(process.env.GEMINI_API_KEYS || "").split(/[\n,]/)
]
    .map(key => String(key || "").trim())
    .filter(Boolean)
    .filter((key, index, keys) => keys.indexOf(key) === index);
const cerebrasApiKey = String(process.env.CEREBRAS_API_KEY || "").trim();
const cerebrasModel = process.env.CEREBRAS_MODEL || "gpt-oss-120b";
const groqApiKey = String(process.env.GROQ_API_KEY || "").trim();
const groqModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const fastTextProvider = (process.env.FAST_TEXT_PROVIDER || "cerebras").toLowerCase();
const twelveLabsApiKey = String(process.env.TWELVELABS_API_KEY || "").trim();
const twelveLabsModel = process.env.TWELVELABS_MODEL || "pegasus1.5";
const twelveLabsMaxMb = envNumber("TWELVELABS_MAX_MB", 190, { min: 1, max: 2048 });
const twelveLabsTimeoutMs = envNumber("TWELVELABS_TIMEOUT_MS", 120000, { min: 5000, max: 600000 });
const siteNotifyEmail = String(process.env.SITE_NOTIFY_EMAIL || "").trim();
if (!siteNotifyEmail) {
    console.warn("Warning: SITE_NOTIFY_EMAIL is not set. Site notification emails will be skipped.");
}
const siteNotifyBackendEmail = process.env.SITE_NOTIFY_BACKEND_EMAIL === "true";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "https://darksalmon-lark-983637.hostingersite.com")
    .split(",")
    .map(origin => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
function isAllowedCorsOrigin(origin) {
    if (!origin) return true;
    const normalized = String(origin).trim().replace(/\/+$/, "");
    if (allowedOrigins.includes(normalized)) return true;
    return /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(normalized);
}
const diagnosticApiKey = String(process.env.DIAGNOSTIC_API_KEY || "").trim();
const exposeDebugErrors = process.env.EXPOSE_DEBUG_ERRORS === "true";
const geminiMaxFileBytes = 2147483648;
const defaultAuditPass = process.env.GEMINI_USE_AUDIT === "true";
const useOpenCvTracker = process.env.USE_OPENCV_TRACKER === "true";
const trackerPython = process.env.TRACKER_PYTHON || "python";
const trackerTimeoutMs = envNumber("TRACKER_TIMEOUT_MS", 180000, { min: 1000, max: 600000 });
const trackerServiceUrl = String(process.env.TRACKER_SERVICE_URL || "").replace(/\/+$/, "");
const remoteTrackerTimeoutMs = envNumber("REMOTE_TRACKER_TIMEOUT_MS", Math.min(trackerTimeoutMs, 45000), { min: 1000, max: 300000 });
const remoteTrackerMaxMb = envNumber("TRACKER_REMOTE_MAX_MB", 250, { min: 1, max: 2048 });
const stripeSecretKey = String(process.env.STRIPE_SECRET_KEY || "").trim();
const stripeWebhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

if (!diagnosticApiKey) {
    console.warn("Security warning: DIAGNOSTIC_API_KEY is not set. Diagnostic routes will stay hidden, but you cannot access them safely.");
} else if (/^https?:\/\//i.test(diagnosticApiKey) || diagnosticApiKey.length < 24) {
    console.warn("Security warning: DIAGNOSTIC_API_KEY should be a long random secret, not a URL or short value.");
}
if (exposeDebugErrors) {
    console.warn("Security warning: EXPOSE_DEBUG_ERRORS=true can leak provider/server details. Keep it false in production.");
}
const statKeys = [
    "touches",
    "shots",
    "shotsOnTarget",
    "passes",
    "passesCompleted",
    "turnovers",
    "duelsWon",
    "duelsLost",
    "possWon",
    "possLost",
    "blockedCross",
    "fouls",
    "cards",
    "goals",
    "assists",
    "goalsConceded",
    "saves",
    "diveCatch",
    "crossClaimed",
    "crossNotClaimed",
    "punches",
    "longBalls",
    "cleanSheet",
    "penaltySaved"
];

const allowedVideoMimeTypes = new Set([
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/webm",
    "video/mpeg"
]);
const allowedVideoExtensions = new Set([".mp4", ".mov", ".avi", ".mkv", ".webm", ".mpeg", ".mpg"]);

const upload = multer({
    dest: uploadsDir,
    limits: {
        fileSize: maxVideoMb * 1024 * 1024,
        files: 1,
        fields: 28,
        fieldSize: 8000,
        parts: 32
    },
    fileFilter(req, file, callback) {
        const extension = path.extname(file.originalname || "").toLowerCase();
        if (allowedVideoMimeTypes.has(file.mimetype) && allowedVideoExtensions.has(extension)) {
            callback(null, true);
            return;
        }
        const err = new Error("Only supported video uploads are allowed.");
        err.code = "INVALID_VIDEO_TYPE";
        callback(err);
    }
});

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((req, res, next) => {
    req.setTimeout?.(10 * 60 * 1000);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Download-Options", "noopen");
    res.setHeader("X-DNS-Prefetch-Control", "off");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
    if (req.secure || req.headers["x-forwarded-proto"] === "https") {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    res.setHeader(
        "Content-Security-Policy",
        [
            "default-src 'self'",
            "script-src 'self' https://www.gstatic.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data: https:",
            "connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://formsubmit.co",
            "media-src 'self' blob:",
            "frame-src 'self' https://matchcalculator-2494f.firebaseapp.com https://accounts.google.com",
            "worker-src 'self'",
            "manifest-src 'self'",
            "form-action 'self' https://formsubmit.co",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "upgrade-insecure-requests"
        ].join("; ")
    );
    next();
});
app.use((req, res, next) => {
    const allowedMethods = new Set(["GET", "HEAD", "POST", "OPTIONS"]);
    if (allowedMethods.has(req.method)) {
        next();
        return;
    }
    logSecurityEvent("blocked-method", req, { method: redactForLog(req.method, 16) });
    res.setHeader("Allow", "GET, HEAD, POST, OPTIONS");
    res.status(405).send("Method not allowed");
});
app.use(cors({
    methods: ["GET", "HEAD", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-diagnostic-key", "stripe-signature"],
    credentials: false,
    maxAge: 600,
    optionsSuccessStatus: 204,
    origin(origin, callback) {
        if (isAllowedCorsOrigin(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error("CORS origin is not allowed."));
    }
}));
app.use("/api", (req, res, next) => {
    const contentLength = Number(req.headers["content-length"] || 0);
    if (contentLength > maxVideoMb * 1024 * 1024 + apiJsonMaxBytes) {
        logSecurityEvent("blocked-content-length", req, { contentLength });
        res.status(413).json({
            error: "Request is too large.",
            message: "Please send a smaller request."
        });
        return;
    }
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
        const contentType = String(req.headers["content-type"] || "").toLowerCase();
        const isJson = contentType.includes("application/json");
        const isMultipart = contentType.includes("multipart/form-data");
        if (!isJson && !isMultipart) {
            logSecurityEvent("blocked-content-type", req, {
                contentType: redactForLog(contentType, 120)
            });
            res.status(415).json({
                error: "Unsupported content type.",
                message: "Use JSON or multipart form data for API requests."
            });
            return;
        }
    }
    next();
});
app.post("/api/billing/stripe-webhook", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
    if (!stripe || !stripeWebhookSecret) {
        res.status(503).json({
            error: "Billing webhook is not configured.",
            message: "Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to enable plan updates."
        });
        return;
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], stripeWebhookSecret);
    } catch {
        res.status(400).json({ error: "Invalid Stripe webhook signature." });
        return;
    }

    if (![
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.payment_failed"
    ].includes(event.type)) {
        res.json({ received: true, ignored: true });
        return;
    }

    const firestore = getAdminFirestore();
    if (!firestore) {
        res.status(503).json({
            error: "Firestore admin is not configured.",
            message: "Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY."
        });
        return;
    }

    try {
        const result = await applyStripePlanEvent({ firestore, event });
        res.json({ received: true, ...result });
    } catch (error) {
        console.error("Stripe billing webhook failed:", error);
        res.status(500).json({ error: "Billing webhook failed." });
    }
});
app.use(express.json({ limit: apiJsonMaxBytes, strict: true, type: ["application/json", "application/*+json"] }));
app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    next();
});
app.get("/robots.txt", (req, res) => {
    res
        .status(200)
        .type("text/plain")
        .set("Cache-Control", "no-cache, no-store, must-revalidate")
        .send(publicRobotsTxt);
});

app.get("/sitemap.xml", (req, res) => {
    res
        .status(200)
        .type("application/xml")
        .set("Cache-Control", "no-cache, no-store, must-revalidate")
        .send(publicSitemapXml);
});

app.get("/.well-known/security.txt", (req, res) => {
    res
        .status(200)
        .type("text/plain")
        .set("Cache-Control", "public, max-age=3600")
        .send([
            "Contact: mailto:awang03@dccs.org",
            "Preferred-Languages: en",
            "Canonical: https://darksalmon-lark-983637.hostingersite.com/.well-known/security.txt",
            "Policy: Please report security issues privately and include steps to reproduce."
        ].join("\n"));
});

app.get("/api/plans", (req, res) => {
    res
        .status(200)
        .set("Cache-Control", "public, max-age=300")
        .json({ plans: publicPlans() });
});

app.get("/api/metrics", requireTrustedOrigin, (req, res) => {
    res
        .status(200)
        .type("text/plain")
        .set("Cache-Control", "no-store")
        .send(formatPrometheusMetrics({
            uptimeSeconds: process.uptime(),
            memory: process.memoryUsage()
        }));
});

app.use((req, res, next) => {
    let pathname = "";
    try {
        pathname = decodeURIComponent(req.path || "").replace(/\\/g, "/").toLowerCase();
    } catch {
        res.status(400).send("Bad request");
        return;
    }
    const blocked = [
        "/server.js",
        "/package.json",
        "/package-lock.json",
        "/.env",
        "/.env.example",
        "/.gitignore",
        "/firebase.json",
        "/firestore.rules",
        "/database.rules.json",
        "/storage.rules",
        "/tracker_api.py",
        "/tracker_service.py",
        "/requirements.txt",
        "/requirements-tracker.txt",
        "/render.yaml",
        "/deployment.md",
        "/vercel.md",
        "/vite.config.js",
        "/readme.md",
        "/backlink-outreach.md"
    ];
    const blockedPrefixes = ["/.git/", "/.agents/", "/.codex/", "/data/", "/uploads/", "/node_modules/", "/__pycache__/"];
    const blockedExtensions = [".zip", ".jsonl", ".log", ".pyc", ".ps1", ".pem", ".key", ".crt", ".map", ".md"];

    if (
        blocked.includes(pathname)
        || blockedPrefixes.some(prefix => pathname.startsWith(prefix))
        || blockedExtensions.some(extension => pathname.endsWith(extension))
    ) {
        logSecurityEvent("blocked-static-path", req, {
            pathname: redactForLog(pathname, 180)
        });
        res.status(404).send("Not found");
        return;
    }
    next();
});

function staticCacheHeaders(filePath) {
    const privatePages = new Set([
        "admin.html",
        "basketball.html",
        "basketball-vault.html",
        "basketball-graph.html",
        "basketball-analysis.html",
        "basketball-compare.html",
        "basketball-profile.html",
        "basketball-team.html",
        "basketball-coach.html",
        "basketball-recruiting.html",
        "basketball-video.html",
        "football.html",
        "football-vault.html",
        "football-graph.html",
        "football-analysis.html",
        "football-compare.html",
        "football-profile.html",
        "football-team.html",
        "football-coach.html",
        "football-recruiting.html",
        "football-video.html",
        "profile.html",
        "team.html",
        "coach.html",
        "recruiting.html"
    ]);
    if (filePath.endsWith(".html")) {
        if (privatePages.has(path.basename(filePath))) {
            return {
                "Cache-Control": "no-store, no-cache, must-revalidate",
                Pragma: "no-cache",
                "X-Robots-Tag": "noindex, nofollow"
            };
        }
        return {
            "Cache-Control": "public, max-age=0, must-revalidate",
            Link: [
                "<https://www.gstatic.com>; rel=preconnect; crossorigin",
                "<https://firestore.googleapis.com>; rel=preconnect",
                "<https://identitytoolkit.googleapis.com>; rel=preconnect"
            ].join(", ")
        };
    }
    if ([
        "firebase-config.js",
        "firebase-errors.js"
    ].includes(path.basename(filePath))) {
        return { "Cache-Control": "no-cache" };
    }
    if (/[\\/]sw\.js$/i.test(filePath)) {
        return { "Cache-Control": "no-cache" };
    }
    if (/\.webmanifest$/i.test(filePath)) {
        return { "Cache-Control": "public, max-age=3600" };
    }
    if (/\.(css|js|png|jpg|jpeg|webp|svg|ico)$/i.test(filePath)) {
        return { "Cache-Control": "public, max-age=31536000, immutable" };
    }
    return {};
}

const reactDistDir = path.join(__dirname, "react", "dist");
const reactIndexPath = path.join(reactDistDir, "index.html");
const hasReactBuild = nodeFs.existsSync(reactIndexPath);
if (!hasReactBuild) {
    console.warn("[startup] WARNING: react/dist/index.html not found. Run 'npm run build' before starting the server. Frontend will not be served.");
} else {
    console.log("[startup] React build found at:", reactDistDir);
}

const legacyRouteRedirects = new Map([
    ["/index.html", "/"],
    ["/nextpage.html", "/vault"],
    ["/graph.html", "/graph"],
    ["/analysis.html", "/analysis"],
    ["/compare.html", "/compare"],
    ["/profile.html", "/profile"],
    ["/team.html", "/team"],
    ["/coach.html", "/coach"],
    ["/recruiting.html", "/recruiting"],
    ["/video.html", "/video"],
    ["/admin.html", "/admin"],
    ["/about.html", "/about"],
    ["/contact.html", "/contact"],
    ["/privacy.html", "/privacy"],
    ["/for-coaches.html", "/for-coaches"],
    ["/other-sports.html", "/other-sports"],
    ["/soccer-performance-guide.html", "/soccer-performance-guide"],
    ["/soccer-player-stats-tracker.html", "/soccer-player-stats-tracker"],
    ["/soccer-rating-calculator.html", "/soccer-rating-calculator"],
    ["/basketball.html", "/basketball"],
    ["/basketball-vault.html", "/basketball/vault"],
    ["/basketball-graph.html", "/basketball/graph"],
    ["/basketball-analysis.html", "/basketball/analysis"],
    ["/basketball-compare.html", "/basketball/compare"],
    ["/basketball-profile.html", "/basketball/profile"],
    ["/basketball-team.html", "/basketball/team"],
    ["/basketball-coach.html", "/basketball/coach"],
    ["/basketball-recruiting.html", "/basketball/recruiting"],
    ["/basketball-video.html", "/basketball/video"],
    ["/football.html", "/football"],
    ["/football-vault.html", "/football/vault"],
    ["/football-graph.html", "/football/graph"],
    ["/football-analysis.html", "/football/analysis"],
    ["/football-compare.html", "/football/compare"],
    ["/football-profile.html", "/football/profile"],
    ["/football-team.html", "/football/team"],
    ["/football-coach.html", "/football/coach"],
    ["/football-recruiting.html", "/football/recruiting"],
    ["/football-video.html", "/football/video"]
]);

app.use((req, res, next) => {
    const target = legacyRouteRedirects.get((req.path || "").toLowerCase());
    if (!target) {
        next();
        return;
    }
    res.redirect(308, target);
});

if (hasReactBuild) {
    app.use(express.static(reactDistDir, {
        dotfiles: "deny",
        fallthrough: true,
        index: "index.html",
        setHeaders(res, filePath) {
            const headers = staticCacheHeaders(filePath);
            Object.entries(headers).forEach(([name, value]) => res.setHeader(name, value));
        }
    }));
}

app.use(express.static(__dirname, {
    dotfiles: "deny",
    fallthrough: true,
    index: false,
    setHeaders(res, filePath) {
        const headers = staticCacheHeaders(filePath);
        Object.entries(headers).forEach(([name, value]) => res.setHeader(name, value));
    }
}));

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanJsonText(text) {
    const cleaned = String(text || "")
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
        return cleaned.slice(firstBrace, lastBrace + 1);
    }
    return cleaned;
}

function parseProviderJson(text) {
    const cleaned = cleanJsonText(text);
    try {
        return JSON.parse(cleaned);
    } catch {
        const okMatch = cleaned.match(/"ok"\s*:\s*(true|false)/i);
        const providerMatch = cleaned.match(/"provider"\s*:\s*"([^"]*)"/i);
        const messageMatch = cleaned.match(/"message"\s*:\s*"([^"]*)"/i);
        if (okMatch || providerMatch || messageMatch) {
            return {
                ok: okMatch ? okMatch[1].toLowerCase() === "true" : true,
                provider: providerMatch ? providerMatch[1] : "unknown",
                message: messageMatch ? messageMatch[1] : "Parsed from partial provider JSON."
            };
        }
        throw new Error(`Provider returned invalid JSON: ${cleaned.slice(0, 300)}`);
    }
}

function parseAiJson(text) {
    try {
        return JSON.parse(cleanJsonText(text));
    } catch {
        return parseProviderJson(text);
    }
}

function numberValue(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
}

function parseMaybeJson(value, fallback = null) {
    if (!value) return fallback;
    if (typeof value === "object") return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

function safeString(value, maxLength = 400) {
    return String(value ?? "").slice(0, maxLength);
}

function safeNumber(value, fallback = null, { min = 0, max = 120 } = {}) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, numeric));
}

function safeFileName(value, fallback = "match-video.mp4") {
    const cleaned = path.basename(String(value || fallback))
        .replace(/[^\w.\-() ]+/g, "_")
        .slice(0, 120)
        .trim();
    return cleaned || fallback;
}

async function assertUploadedVideoLooksSafe(req) {
    const file = req.file;
    if (!file?.path) throw new Error("Missing uploaded file.");
    const handle = await fs.open(file.path, "r");
    let bytesRead = 0;
    const head = Buffer.alloc(32);
    try {
        const result = await handle.read(head, 0, head.length, 0);
        bytesRead = result.bytesRead;
    } finally {
        await handle.close().catch(() => {});
    }
    const bytes = head.subarray(0, bytesRead);
    const sample = bytes.subarray(0, Math.min(bytes.length, 32));
    const ascii = sample.toString("latin1");
    const isMp4Like = sample.length >= 12 && ascii.slice(4, 8) === "ftyp";
    const isWebmOrMkv = sample.length >= 4
        && sample[0] === 0x1a
        && sample[1] === 0x45
        && sample[2] === 0xdf
        && sample[3] === 0xa3;
    const isAvi = ascii.startsWith("RIFF") && ascii.slice(8, 11) === "AVI";
    const isMpeg = (sample[0] === 0x00 && sample[1] === 0x00 && sample[2] === 0x01 && [0xba, 0xb3].includes(sample[3]))
        || (sample[0] === 0xff && (sample[1] & 0xe0) === 0xe0);

    if (isMp4Like || isWebmOrMkv || isAvi || isMpeg) return;

    await logSecurityEvent("rejected-upload-signature", req, {
        mimeType: redactForLog(file.mimetype || ""),
        originalName: redactForLog(file.originalname || ""),
        size: Number(file.size || 0)
    });
    const error = new Error("Uploaded file does not look like a supported video.");
    error.statusCode = 415;
    throw error;
}

function clientIp(req) {
    return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "")
        .split(",")[0]
        .trim();
}

function redactForLog(value, maxLength = 220) {
    return safeString(value, maxLength)
        .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[redacted-google-key]")
        .replace(/\bgsk_[0-9A-Za-z_-]{20,}/g, "[redacted-groq-key]")
        .replace(/\bcsk-[0-9A-Za-z_-]{20,}/g, "[redacted-cerebras-key]")
        .replace(/\btlk_[0-9A-Za-z_-]{20,}/g, "[redacted-twelvelabs-key]");
}

function redactUrlForLog(value, maxLength = 260) {
    const raw = safeString(value, maxLength * 3);
    try {
        const url = new URL(raw, "https://match-rating.local");
        const sensitiveParams = [
            "key",
            "token",
            "secret",
            "password",
            "api_key",
            "apikey",
            "diagnostic",
            "diagnostic_key",
            "x-diagnostic-key"
        ];
        for (const param of sensitiveParams) {
            if (url.searchParams.has(param)) url.searchParams.set(param, "[redacted]");
        }
        const pathAndQuery = `${url.pathname}${url.search}${url.hash}`;
        return redactForLog(pathAndQuery, maxLength);
    } catch {
        return redactForLog(raw.replace(/([?&](?:key|token|secret|password|api_?key|diagnostic(?:_key)?)=)[^&\s]+/gi, "$1[redacted]"), maxLength);
    }
}

async function appendJsonLineWithCap(filePath, record, { maxBytes = 1024 * 1024, maxLines = 1000 } = {}) {
    const line = `${JSON.stringify(record)}\n`;
    try {
        const stat = await fs.stat(filePath).catch(error => {
            if (error.code === "ENOENT") return null;
            throw error;
        });
        if (stat && stat.size > maxBytes) {
            const text = await fs.readFile(filePath, "utf8").catch(() => "");
            const trimmed = text
                .split("\n")
                .filter(Boolean)
                .slice(-maxLines)
                .join("\n");
            await fs.writeFile(filePath, trimmed ? `${trimmed}\n` : "", "utf8");
        }
        await fs.appendFile(filePath, line, "utf8");
    } catch {
        // Security logging should never break the request path.
    }
}

async function logSecurityEvent(type, req, details = {}) {
    const event = {
        type,
        path: redactUrlForLog(req.originalUrl || req.url || ""),
        method: req.method,
        ip: clientIp(req),
        origin: requestOrigin(req),
        userAgent: redactForLog(req.headers["user-agent"] || "", 260),
        details,
        createdAt: new Date().toISOString()
    };
    await appendJsonLineWithCap(securityEventsPath, event, {
        maxBytes: securityEventsMaxBytes,
        maxLines: securityEventsMaxLines
    });
}

function secureStringEqual(left, right) {
    const a = Buffer.from(String(left || ""));
    const b = Buffer.from(String(right || ""));
    if (!a.length || a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}

function requestOrigin(req) {
    const origin = String(req.headers.origin || "").trim();
    if (origin) return origin;
    const referer = String(req.headers.referer || "").trim();
    if (!referer) return "";
    try {
        return new URL(referer).origin;
    } catch {
        return "";
    }
}

function isTrustedRequestOrigin(req) {
    return allowedOrigins.includes(requestOrigin(req));
}

function requireTrustedOrigin(req, res, next) {
    const origin = String(req.headers.origin || "").trim();
    if (origin && allowedOrigins.includes(origin)) {
        next();
        return;
    }
    logSecurityEvent("blocked-origin", req, {
        allowedOrigins: allowedOrigins.length,
        origin: redactForLog(origin || requestOrigin(req))
    });
    res.status(403).json({
        error: "Request origin is not allowed.",
        message: "This request must come from the Veyro website."
    });
}

async function requireVideoAiEntitlement(req, res, next) {
    const token = bearerTokenFromHeader(req.headers.authorization || "");
    if (!token) {
        res.status(401).json({
            error: "Sign in required.",
            message: "Video AI requires a signed-in Premium account."
        });
        return;
    }

    const adminAuth = getAdminAuth();
    const firestore = getAdminFirestore();
    if (!adminAuth || !firestore) {
        res.status(503).json({
            error: "Billing entitlement check is not configured.",
            message: "Add Firebase Admin environment variables before enabling Video AI in production."
        });
        return;
    }

    try {
        const decoded = await adminAuth.verifyIdToken(token);
        const email = decoded.email || "";
        const profileSnap = await firestore.collection("users").doc(decoded.uid).get();
        const profile = profileSnap.exists ? profileSnap.data() : {};

        if (!canUseVideoAiEntitlement({ profile, email })) {
            res.status(403).json({
                error: "Premium required.",
                message: "Video AI is available only for Premium accounts or the admin."
            });
            return;
        }

        req.entitlementUser = {
            uid: decoded.uid,
            email,
            planTier: profile?.planTier || "free",
            planStatus: profile?.planStatus || "active"
        };
        next();
    } catch (error) {
        logSecurityEvent("video-ai-entitlement-denied", req, {
            reason: redactForLog(error?.code || error?.message || "token-verification-failed", 120)
        });
        res.status(401).json({
            error: "Invalid sign-in token.",
            message: "Sign in again before using Video AI."
        });
    }
}

function requireDiagnosticAccess(req, res, next) {
    const supplied = String(req.headers["x-diagnostic-key"] || req.query.key || "").trim();
    if (diagnosticApiKey && secureStringEqual(supplied, diagnosticApiKey)) {
        next();
        return;
    }

    logSecurityEvent("blocked-diagnostic", req, {
        supplied: supplied ? "[provided]" : "[missing]"
    });
    res.status(404).json({ error: "Not found" });
}

function publicErrorMessage(error, fallback = "The request could not be completed.") {
    if (exposeDebugErrors) return error?.message || fallback;
    return fallback;
}

function publicProviderFailures(failures = []) {
    return failures.map(item => ({
        provider: item.provider,
        message: "Provider failed. Check server logs for details."
    }));
}

async function cleanupUploadedFile(req) {
    if (req?.file?.path) {
        await fs.unlink(req.file.path).catch(() => {});
    }
}

async function cleanupStaleUploads(maxAgeMs = 6 * 60 * 60 * 1000) {
    try {
        const entries = await fs.readdir(uploadsDir, { withFileTypes: true });
        const now = Date.now();
        await Promise.all(entries
            .filter(entry => entry.isFile())
            .map(async entry => {
                const fullPath = path.join(uploadsDir, entry.name);
                const stat = await fs.stat(fullPath).catch(() => null);
                if (stat && now - stat.mtimeMs > maxAgeMs) {
                    await fs.unlink(fullPath).catch(() => {});
                }
            }));
    } catch (error) {
        console.warn("Stale upload cleanup failed:", error.message);
    }
}

function sanitizeVideoRequestBody(body = {}) {
    const sanitized = {
        provider: ["gemini", "twelvelabs", "auto"].includes(String(body.provider || "").toLowerCase())
            ? String(body.provider).toLowerCase()
            : "twelvelabs",
        playerNumber: safeString(body.playerNumber, 24),
        position: safeString(body.position, 40),
        teamColor: safeString(body.teamColor, 80),
        opponentColor: safeString(body.opponentColor, 80),
        playerDescription: safeString(body.playerDescription, 600),
        startingLocation: safeString(body.startingLocation, 600),
        analysisDepth: ["fast", "balanced", "detailed"].includes(String(body.analysisDepth || "").toLowerCase())
            ? String(body.analysisDepth).toLowerCase()
            : "fast",
        extraInstructions: safeString(body.extraInstructions, 900),
        prompt: safeString(body.prompt, 900)
    };
    const lock = parseMaybeJson(body.playerLock, null);
    if (lock) sanitized.playerLock = JSON.stringify(normalizePlayerLock(lock, sanitized));
    return sanitized;
}

cleanupStaleUploads();
setInterval(() => cleanupStaleUploads(), 60 * 60 * 1000).unref?.();

const rateLimitBuckets = new Map();

function rateLimit({ windowMs, max, label }) {
    return (req, res, next) => {
        const now = Date.now();
        const key = `${label}:${clientIp(req) || "unknown"}`;
        const current = rateLimitBuckets.get(key) || { count: 0, resetAt: now + windowMs };

        if (current.resetAt <= now) {
            current.count = 0;
            current.resetAt = now + windowMs;
        }

        current.count += 1;
        rateLimitBuckets.set(key, current);

        const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
        res.setHeader("RateLimit-Limit", String(max));
        res.setHeader("RateLimit-Remaining", String(Math.max(0, max - current.count)));
        res.setHeader("RateLimit-Reset", String(retryAfterSeconds));

        if (current.count > max) {
            res.setHeader("Retry-After", String(retryAfterSeconds));
            logSecurityEvent("rate-limit", req, {
                label,
                retryAfterSeconds,
                limit: max
            });
            res.status(429).json({
                error: "Too many requests.",
                message: `Please wait ${retryAfterSeconds} seconds before trying again.`
            });
            return;
        }

        next();
    };
}

setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of rateLimitBuckets.entries()) {
        if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
    }
}, 10 * 60 * 1000).unref?.();

const notificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: envNumber("NOTIFICATION_RATE_LIMIT", 30, { min: 1, max: 300 }),
    label: "site-notification"
});
const correctionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: envNumber("CORRECTION_RATE_LIMIT", 20, { min: 1, max: 200 }),
    label: "video-correction"
});
const videoAiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: envNumber("VIDEO_AI_RATE_LIMIT", 8, { min: 1, max: 100 }),
    label: "video-ai"
});
const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: envNumber("GENERAL_API_RATE_LIMIT", 120, { min: 10, max: 1000 }),
    label: "api"
});

app.use("/api", generalApiLimiter);

async function notifyByFormSubmit(subject, message) {
    if (!siteNotifyEmail) return { ok: false, skipped: true };
    const form = new URLSearchParams();
    form.set("name", "Veyro Website");
    form.set("email", siteNotifyEmail);
    form.set("_subject", subject);
    form.set("message", message);

    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(siteNotifyEmail)}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        },
        body: form.toString()
    });

    if (!response.ok) {
        throw new Error(`FormSubmit returned ${response.status}`);
    }

    return response.json().catch(() => ({ ok: true }));
}

function compactJson(value, maxLength = 7000) {
    const text = JSON.stringify(value || null, null, 2);
    return text.length > maxLength ? `${text.slice(0, maxLength)}\n...truncated...` : text;
}

function geminiErrorText(error) {
    return [
        error?.message,
        error?.status,
        error?.code,
        error?.response?.status,
        typeof error === "string" ? error : ""
    ].filter(Boolean).join(" ");
}

function isRetryableGeminiError(error) {
    const text = geminiErrorText(error).toLowerCase();
    return [
        "429",
        "503",
        "resource_exhausted",
        "unavailable",
        "quota",
        "rate limit",
        "rate-limit",
        "retry"
    ].some(pattern => text.includes(pattern));
}

async function runWithGeminiFallback(task) {
    if (!geminiApiKeys.length) {
        throw new Error("Missing GEMINI_API_KEY. Add GEMINI_API_KEY or GEMINI_API_KEYS in environment variables.");
    }

    const failures = [];
    for (let index = 0; index < geminiApiKeys.length; index += 1) {
        const ai = new GoogleGenAI({ apiKey: geminiApiKeys[index] });
        try {
            const result = await task(ai, index);
            return {
                ...result,
                geminiKeyIndex: index + 1,
                geminiKeyCount: geminiApiKeys.length,
                geminiFallbacksUsed: failures.length
            };
        } catch (error) {
            failures.push({
                keyIndex: index + 1,
                message: error.message || String(error)
            });

            if (!isRetryableGeminiError(error) || index === geminiApiKeys.length - 1) {
                const retrySummary = failures.length > 1
                    ? ` Gemini key attempts: ${failures.map(item => `#${item.keyIndex}: ${item.message}`).join(" | ")}`
                    : "";
                error.message = `${error.message || String(error)}${retrySummary}`;
                throw error;
            }

            console.warn(`Gemini key #${index + 1} failed with a retryable error. Trying next key.`, error.message);
        }
    }

    throw new Error("All Gemini API keys failed.");
}

async function callOpenAiCompatibleJson({ provider, url, apiKey, modelName, prompt, system = "Return valid JSON only.", maxTokens = 900 }) {
    const body = {
        model: modelName,
        messages: [
            { role: "system", content: system },
            { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_completion_tokens: maxTokens
    };

    if (provider !== "cerebras") {
        body.response_format = { type: "json_object" };
    }

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(`${provider} returned ${response.status}: ${payload?.error?.message || payload?.message || JSON.stringify(payload)}`);
    }

    const content = payload?.choices?.[0]?.message?.content || payload?.choices?.[0]?.text || "";
    return {
        provider,
        model: modelName,
        raw: payload,
        json: parseProviderJson(content)
    };
}

async function runFastTextJson(prompt, options = {}) {
    const providers = [];
    const addProvider = name => {
        if (!providers.includes(name)) providers.push(name);
    };

    addProvider(options.prefer || fastTextProvider);
    addProvider("cerebras");
    addProvider("groq");

    const failures = [];
    for (const provider of providers) {
        try {
            if (provider === "cerebras" && cerebrasApiKey) {
                return await callOpenAiCompatibleJson({
                    provider: "cerebras",
                    url: "https://api.cerebras.ai/v1/chat/completions",
                    apiKey: cerebrasApiKey,
                    modelName: cerebrasModel,
                    prompt,
                    system: options.system,
                    maxTokens: options.maxTokens
                });
            }

            if (provider === "groq" && groqApiKey) {
                return await callOpenAiCompatibleJson({
                    provider: "groq",
                    url: "https://api.groq.com/openai/v1/chat/completions",
                    apiKey: groqApiKey,
                    modelName: groqModel,
                    prompt,
                    system: options.system,
                    maxTokens: options.maxTokens
                });
            }
        } catch (error) {
            failures.push(`${provider}: ${error.message}`);
            console.warn(`Fast text provider ${provider} failed.`, error.message);
        }
    }

    throw new Error(`No fast text provider completed successfully. ${failures.join(" | ")}`);
}

async function fetchTwelveLabs(pathname, options = {}) {
    const response = await fetch(`https://api.twelvelabs.io/v1.3${pathname}`, {
        ...options,
        headers: {
            "x-api-key": twelveLabsApiKey,
            ...(options.headers || {})
        }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(`TwelveLabs returned ${response.status}: ${payload?.message || payload?.error || JSON.stringify(payload)}`);
    }
    return payload;
}

async function uploadTwelveLabsAsset(videoPath, originalName = "match-video.mp4") {
    const fileInfo = await fs.stat(videoPath);
    const fileSizeMb = fileInfo.size / 1024 / 1024;
    if (fileSizeMb > twelveLabsMaxMb) {
        throw new Error(`TwelveLabs direct upload skipped because the video is ${fileSizeMb.toFixed(1)} MB and TWELVELABS_MAX_MB is ${twelveLabsMaxMb} MB.`);
    }

    const videoBlob = typeof nodeFs.openAsBlob === "function"
        ? await nodeFs.openAsBlob(videoPath)
        : new Blob([await fs.readFile(videoPath)]);
    const formData = new FormData();
    formData.append("method", "direct");
    formData.append("file", videoBlob, safeFileName(originalName));

    const response = await fetch("https://api.twelvelabs.io/v1.3/assets", {
        method: "POST",
        headers: {
            "x-api-key": twelveLabsApiKey
        },
        body: formData
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(`TwelveLabs asset upload returned ${response.status}: ${payload?.message || payload?.error || JSON.stringify(payload)}`);
    }

    const assetId = payload.id || payload._id || payload.asset_id || payload.assetId || payload.data?.id;
    if (!assetId) {
        throw new Error(`TwelveLabs asset upload did not return an asset id: ${JSON.stringify(payload).slice(0, 500)}`);
    }
    return { assetId, payload };
}

async function waitForTwelveLabsAsset(assetId, initialPayload = {}) {
    let asset = initialPayload;
    const maxPolls = Number(process.env.TWELVELABS_ASSET_MAX_POLLS || 30);
    const pollMs = Number(process.env.TWELVELABS_ASSET_POLL_MS || 2000);

    for (let attempt = 0; attempt < maxPolls; attempt += 1) {
        const status = String(asset.status || "").toLowerCase();
        if (!status || status === "ready") return asset;
        if (status === "failed") {
            throw new Error(`TwelveLabs asset processing failed: ${JSON.stringify(asset).slice(0, 500)}`);
        }
        await sleep(pollMs);
        asset = await fetchTwelveLabs(`/assets/${assetId}`);
    }

    throw new Error("TwelveLabs asset processing timed out.");
}

async function analyzeWithTwelveLabs(videoPath, body = {}, originalName = "match-video.mp4", maxEvents = 120) {
    if (!twelveLabsApiKey) {
        throw new Error("Missing TWELVELABS_API_KEY.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), twelveLabsTimeoutMs);
    let uploadedAsset = null;

    try {
        uploadedAsset = await uploadTwelveLabsAsset(videoPath, originalName);
        await waitForTwelveLabsAsset(uploadedAsset.assetId, uploadedAsset.payload);
        const prompt = buildTwelveLabsPrompt(body);
        const analysisResponse = await fetch("https://api.twelvelabs.io/v1.3/analyze", {
            method: "POST",
            headers: {
                "x-api-key": twelveLabsApiKey,
                "Content-Type": "application/json"
            },
            signal: controller.signal,
            body: JSON.stringify({
                model_name: twelveLabsModel,
                video: {
                    type: "asset_id",
                    asset_id: uploadedAsset.assetId
                },
                prompt,
                temperature: 0.1,
                response_format: {
                    type: "json_schema",
                    json_schema: buildTwelveLabsResponseSchema()
                },
                max_tokens: 4096,
                stream: false
            })
        });
        const payload = await analysisResponse.json().catch(() => ({}));
        if (!analysisResponse.ok) {
            throw new Error(`TwelveLabs analyze returned ${analysisResponse.status}: ${payload?.message || payload?.error || JSON.stringify(payload)}`);
        }

        const answer = payload.data || payload.text || payload.output || payload.answer || payload.result || payload.choices?.[0]?.message?.content || JSON.stringify(payload);
        const parsed = parseAiJson(answer);
        return {
            stats: normalizeStats(parsed, maxEvents),
            raw: parsed,
            provider: "twelvelabs",
            providerModel: twelveLabsModel,
            asset: {
                id: uploadedAsset.assetId
            }
        };
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error(`TwelveLabs timed out after ${Math.round(twelveLabsTimeoutMs / 1000)} seconds.`);
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function playerLockWithTwelveLabs(videoPath, body = {}, originalName = "match-video.mp4") {
    if (!twelveLabsApiKey) {
        throw new Error("Missing TWELVELABS_API_KEY.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), twelveLabsTimeoutMs);
    let uploadedAsset = null;

    try {
        uploadedAsset = await uploadTwelveLabsAsset(videoPath, originalName);
        await waitForTwelveLabsAsset(uploadedAsset.assetId, uploadedAsset.payload);
        const response = await fetch("https://api.twelvelabs.io/v1.3/analyze", {
            method: "POST",
            headers: {
                "x-api-key": twelveLabsApiKey,
                "Content-Type": "application/json"
            },
            signal: controller.signal,
            body: JSON.stringify({
                model_name: twelveLabsModel,
                video: {
                    type: "asset_id",
                    asset_id: uploadedAsset.assetId
                },
                prompt: buildTwelveLabsPlayerLockPrompt(body),
                temperature: 0.1,
                response_format: {
                    type: "json_schema",
                    json_schema: buildTwelveLabsPlayerLockSchema()
                },
                max_tokens: 1400,
                stream: false
            })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(`TwelveLabs player lock returned ${response.status}: ${payload?.message || payload?.error || JSON.stringify(payload)}`);
        }
        const answer = payload.data || payload.text || payload.output || payload.answer || payload.result || payload.choices?.[0]?.message?.content || JSON.stringify(payload);
        const parsed = parseAiJson(answer);
        return {
            playerLock: {
                ...normalizePlayerLock(parsed, body),
                source: "twelvelabs-player-lock"
            },
            provider: "twelvelabs",
            providerModel: twelveLabsModel,
            asset: {
                id: uploadedAsset.assetId
            }
        };
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error(`TwelveLabs player lock timed out after ${Math.round(twelveLabsTimeoutMs / 1000)} seconds.`);
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function analyzeWithGemini(videoPath, body = {}, originalName = "match-video.mp4", mimeType = "video/mp4", maxEvents = 120, useAuditPass = false) {
    if (!geminiApiKeys.length) {
        throw new Error("Missing GEMINI_API_KEY.");
    }

    const result = await runWithGeminiFallback(async ai => {
        const uploadedVideo = await ai.files.upload({
            file: videoPath,
            config: {
                mimeType,
                displayName: safeFileName(originalName)
            }
        });

        const activeVideo = await waitForActiveFile(ai, uploadedVideo);
        const prompt = buildAnalysisPrompt(body);
        const response = await ai.models.generateContent({
            model,
            contents: [
                createUserContent([
                    createPartFromUri(activeVideo.uri, activeVideo.mimeType),
                    prompt
                ])
            ],
            config: {
                responseMimeType: "application/json"
            }
        });

        let text = cleanJsonText(response.text);
        let parsed = JSON.parse(text);

        if (useAuditPass) {
            const auditPrompt = buildAuditPrompt(JSON.stringify(parsed, null, 2));
            if (cerebrasApiKey || groqApiKey) {
                try {
                    const audit = await runFastTextJson(auditPrompt, {
                        prefer: fastTextProvider,
                        system: "You repair soccer stats JSON. Return valid JSON only and keep the requested schema.",
                        maxTokens: 1800
                    });
                    parsed = audit.json;
                } catch (error) {
                    console.error("Fast audit failed, falling back to Gemini audit:", error);
                    const auditResponse = await ai.models.generateContent({
                        model,
                        contents: createUserContent(auditPrompt),
                        config: {
                            responseMimeType: "application/json"
                        }
                    });
                    text = cleanJsonText(auditResponse.text);
                    parsed = JSON.parse(text);
                }
            } else {
                const auditResponse = await ai.models.generateContent({
                    model,
                    contents: createUserContent(auditPrompt),
                    config: {
                        responseMimeType: "application/json"
                    }
                });
                text = cleanJsonText(auditResponse.text);
                parsed = JSON.parse(text);
            }
        }

        return {
            stats: normalizeStats(parsed, maxEvents),
            raw: parsed,
            provider: "gemini",
            providerModel: model,
            file: {
                name: activeVideo.name,
                uri: activeVideo.uri,
                mimeType: activeVideo.mimeType
            }
        };
    });

    return {
        ...result,
        provider: "gemini",
        providerModel: model
    };
}

function runPythonTracker(args) {
    return new Promise(resolve => {
        const child = spawn(trackerPython, args, {
            cwd: __dirname,
            windowsHide: true
        });
        let stdout = "";
        let stderr = "";
        let settled = false;
        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            child.kill("SIGKILL");
            resolve({
                ok: false,
                reason: `Tracker timed out after ${Math.round(trackerTimeoutMs / 1000)} seconds.`,
                stderr: stderr.slice(-1200)
            });
        }, trackerTimeoutMs);

        child.stdout.on("data", chunk => {
            stdout += chunk.toString();
            if (stdout.length > 250000) stdout = stdout.slice(-250000);
        });

        child.stderr.on("data", chunk => {
            stderr += chunk.toString();
            if (stderr.length > 8000) stderr = stderr.slice(-8000);
        });

        child.on("error", error => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve({
                ok: false,
                reason: "Could not start Python tracker.",
                message: error.message
            });
        });

        child.on("close", code => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            try {
                const parsed = JSON.parse(stdout || "{}");
                resolve({
                    ...parsed,
                    exitCode: code,
                    stderr: stderr.slice(-1200)
                });
            } catch (error) {
                resolve({
                    ok: false,
                    reason: "Python tracker returned invalid JSON.",
                    message: error.message,
                    exitCode: code,
                    stdout: stdout.slice(-1200),
                    stderr: stderr.slice(-1200)
                });
            }
        });
    });
}

async function callRemoteTracker(videoPath, body = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), remoteTrackerTimeoutMs);

    try {
        const fileInfo = await fs.stat(videoPath);
        const fileSizeMb = fileInfo.size / 1024 / 1024;
        if (fileSizeMb > remoteTrackerMaxMb) {
            return {
                ok: false,
                remote: true,
                skipped: true,
                serviceUrl: trackerServiceUrl,
                reason: `Remote tracker skipped because the video is ${fileSizeMb.toFixed(1)} MB and TRACKER_REMOTE_MAX_MB is ${remoteTrackerMaxMb} MB.`,
                guidance: "Use a shorter clip for OpenCV tracking, or raise TRACKER_REMOTE_MAX_MB if your host can handle larger uploads."
            };
        }

        const videoBlob = typeof nodeFs.openAsBlob === "function"
            ? await nodeFs.openAsBlob(videoPath)
            : new Blob([await fs.readFile(videoPath)]);
        const formData = new FormData();
        formData.append("video", videoBlob, path.basename(videoPath));
        formData.append("playerNumber", safeString(body.playerNumber, 40));
        formData.append("position", safeString(body.position, 80));
        formData.append("teamColor", safeString(body.teamColor, 120));
        formData.append("opponentColor", safeString(body.opponentColor, 120));
        formData.append("playerDescription", safeString(body.playerDescription, 600));
        formData.append("startingLocation", safeString(body.startingLocation, 600));
        formData.append("sampleFps", safeString(process.env.TRACKER_SAMPLE_FPS || "1", 20));
        formData.append("maxFrames", safeString(process.env.TRACKER_MAX_FRAMES || "360", 20));
        formData.append("confidence", safeString(process.env.TRACKER_CONFIDENCE || "0.35", 20));

        const response = await fetch(`${trackerServiceUrl}/track-video`, {
            method: "POST",
            body: formData,
            signal: controller.signal
        });
        const result = await response.json().catch(() => ({}));

        return {
            ...result,
            remote: true,
            serviceUrl: trackerServiceUrl,
            status: response.status,
            ok: response.ok && result.ok !== false
        };
    } catch (error) {
        return {
            ok: false,
            remote: true,
            serviceUrl: trackerServiceUrl,
            reason: error.name === "AbortError"
                ? `Remote tracker timed out after ${Math.round(remoteTrackerTimeoutMs / 1000)} seconds.`
                : "Remote tracker request failed.",
            message: error.message
        };
    } finally {
        clearTimeout(timeout);
    }
}

async function buildTrackerContext(videoPath, body = {}) {
    if (!useOpenCvTracker) {
        return {
            ok: false,
            enabled: false,
            reason: "OpenCV tracker is disabled. Set USE_OPENCV_TRACKER=true to enable it."
        };
    }

    if (trackerServiceUrl) {
        return callRemoteTracker(videoPath, body);
    }

    const args = [
        path.join(__dirname, "tracker_service.py"),
        "--video", videoPath,
        "--player-number", safeString(body.playerNumber, 40),
        "--position", safeString(body.position, 80),
        "--team-color", safeString(body.teamColor, 120),
        "--opponent-color", safeString(body.opponentColor, 120),
        "--description", safeString(body.playerDescription, 600),
        "--starting-location", safeString(body.startingLocation, 600),
        "--sample-fps", safeString(process.env.TRACKER_SAMPLE_FPS || "1", 20),
        "--max-frames", safeString(process.env.TRACKER_MAX_FRAMES || "360", 20)
    ];

    return runPythonTracker(args);
}

function summarizeStatDifferences(originalStats = {}, correctedStats = {}) {
    return statKeys
        .map(key => {
            const before = numberValue(originalStats[key]);
            const after = numberValue(correctedStats[key]);
            return { key, before, after, change: after - before };
        })
        .filter(item => item.change !== 0)
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}

async function loadRecentCorrectionLessons(limit = 8) {
    try {
        const text = await fs.readFile(correctionsPath, "utf8");
        return text
            .trim()
            .split("\n")
            .filter(Boolean)
            .slice(-limit)
            .map(line => JSON.parse(line))
            .map(record => ({
                playerNumber: record.context?.playerNumber || "",
                position: record.context?.position || "",
                teamColor: record.context?.teamColor || "",
                lesson: record.lesson?.lesson || record.lesson?.summary || "",
                preventNextTime: record.lesson?.preventNextTime || [],
                watchStats: record.lesson?.watchStats || [],
                biggestDifferences: (record.differences || []).slice(0, 5)
            }))
            .filter(record => record.lesson || record.biggestDifferences.length);
    } catch {
        return [];
    }
}

function correctionRelevanceScore(memory = {}, body = {}) {
    let score = 0;
    if (memory.position && body.position && String(memory.position).toLowerCase() === String(body.position).toLowerCase()) score += 3;
    if (memory.playerNumber && body.playerNumber && String(memory.playerNumber).trim() === String(body.playerNumber).trim()) score += 2;
    if (memory.teamColor && body.teamColor && String(memory.teamColor).toLowerCase() === String(body.teamColor).toLowerCase()) score += 1;
    return score;
}

function compileCorrectionMemoryGuide(body = {}) {
    const memory = Array.isArray(body.correctionMemory) ? body.correctionMemory : [];
    if (!memory.length) {
        return {
            applied: false,
            summary: "No previous correction lessons saved yet.",
            directives: [],
            watchStats: [],
            statBias: [],
            relevantLessons: []
        };
    }

    const ranked = memory
        .map(item => ({
            ...item,
            relevance: correctionRelevanceScore(item, body)
        }))
        .sort((a, b) => b.relevance - a.relevance);
    const relevantLessons = ranked.slice(0, 5);
    const statTotals = new Map();
    const directives = [];
    const watchStats = new Set();

    relevantLessons.forEach(item => {
        if (item.lesson) directives.push(item.lesson);
        (item.preventNextTime || []).forEach(rule => directives.push(rule));
        (item.watchStats || []).forEach(stat => watchStats.add(stat));
        (item.biggestDifferences || []).forEach(diff => {
            if (!diff?.key) return;
            watchStats.add(diff.key);
            const current = statTotals.get(diff.key) || { key: diff.key, corrections: 0, netChange: 0, undercounted: 0, overcounted: 0 };
            const change = numberValue(diff.change);
            current.corrections += 1;
            current.netChange += change;
            if (change > 0) current.undercounted += 1;
            if (change < 0) current.overcounted += 1;
            statTotals.set(diff.key, current);
        });
    });

    const statBias = [...statTotals.values()]
        .sort((a, b) => Math.abs(b.netChange) - Math.abs(a.netChange))
        .slice(0, 8)
        .map(item => ({
            ...item,
            direction: item.undercounted > item.overcounted
                ? "previous AI undercounted this stat"
                : item.overcounted > item.undercounted
                    ? "previous AI overcounted this stat"
                    : "previous corrections changed this stat both ways"
        }));

    const uniqueDirectives = [...new Set(directives.map(rule => safeString(rule, 220)).filter(Boolean))].slice(0, 10);
    const uniqueWatchStats = [...watchStats].filter(Boolean).slice(0, 10);

    return {
        applied: true,
        summary: `Using ${relevantLessons.length} recent correction lesson${relevantLessons.length === 1 ? "" : "s"}; watch ${uniqueWatchStats.length ? uniqueWatchStats.join(", ") : "corrected stat patterns"}.`,
        directives: uniqueDirectives,
        watchStats: uniqueWatchStats,
        statBias,
        relevantLessons: relevantLessons.map(item => ({
            relevance: item.relevance,
            playerNumber: item.playerNumber || "",
            position: item.position || "",
            teamColor: item.teamColor || "",
            lesson: safeString(item.lesson || "", 260),
            preventNextTime: (item.preventNextTime || []).slice(0, 4),
            biggestDifferences: (item.biggestDifferences || []).slice(0, 4)
        }))
    };
}

async function saveCorrectionRecord(record) {
    await appendJsonLineWithCap(correctionsPath, record, {
        maxBytes: envNumber("CORRECTIONS_MAX_BYTES", 512 * 1024, { min: 64 * 1024, max: 10 * 1024 * 1024 }),
        maxLines: envNumber("CORRECTIONS_MAX_LINES", 200, { min: 20, max: 2000 })
    });
}

function normalizeStats(rawStats = {}, maxEvents = 120) {
    const normalized = Object.fromEntries(statKeys.map(key => [key, numberValue(rawStats[key])]));
    return {
        ...normalized,
        confidence: rawStats.confidence || "medium",
        trackingConfidence: rawStats.trackingConfidence || rawStats.confidence || "medium",
        notes: rawStats.notes || "",
        playerIdentity: rawStats.playerIdentity || "",
        uncertainty: Array.isArray(rawStats.uncertainty) ? rawStats.uncertainty : [],
        eventLog: Array.isArray(rawStats.eventLog) ? rawStats.eventLog.slice(0, maxEvents) : [],
        calculatorInputs: buildCalculatorInputs(normalized)
    };
}

function normalizePlayerLock(rawLock = {}, body = {}) {
    const primaryClues = Array.isArray(rawLock.primaryClues) ? rawLock.primaryClues.filter(Boolean) : [];
    const relockRules = Array.isArray(rawLock.relockRules) ? rawLock.relockRules.filter(Boolean) : [];
    const uncertainty = Array.isArray(rawLock.uncertainty) ? rawLock.uncertainty.filter(Boolean) : [];

    return {
        playerNumber: String(rawLock.playerNumber || body.playerNumber || ""),
        position: rawLock.position || body.position || "",
        teamColor: rawLock.teamColor || body.teamColor || "",
        opponentColor: rawLock.opponentColor || body.opponentColor || "",
        playerIdentity: rawLock.playerIdentity || `Player #${body.playerNumber || ""}`,
        lockSummary: rawLock.lockSummary || rawLock.playerIdentity || "Use the typed clues to keep tracking the same player.",
        primaryClues,
        relockRules: relockRules.length ? relockRules : [
            "After every camera cut, re-check kit color, number, body shape, field role, and starting-side continuity.",
            "If the jersey number is blurry, prefer the user's description and movement continuity over guessing a different player.",
            "Do not count events when the target player is lost or hidden."
        ],
        likelyZones: Array.isArray(rawLock.likelyZones) ? rawLock.likelyZones.filter(Boolean) : [],
        avoidConfusions: Array.isArray(rawLock.avoidConfusions) ? rawLock.avoidConfusions.filter(Boolean) : [],
        firstSightings: Array.isArray(rawLock.firstSightings) ? rawLock.firstSightings.filter(Boolean) : [],
        confidence: rawLock.confidence || "medium",
        uncertainty,
        source: rawLock.source || "gemini-player-lock"
    };
}

function buildCalculatorInputs(stats) {
    const missedPasses = Math.max(0, numberValue(stats.passes) - numberValue(stats.passesCompleted));
    return {
        statInputs: {
            touches: numberValue(stats.touches),
            accurate_pass: numberValue(stats.passesCompleted),
            missed_pass: missedPasses,
            ontarget_scoring_att: numberValue(stats.shotsOnTarget),
            big_chance_missed: Math.max(0, numberValue(stats.shots) - numberValue(stats.shotsOnTarget)),
            duel_won: numberValue(stats.duelsWon),
            duel_lost: numberValue(stats.duelsLost),
            poss_won: numberValue(stats.possWon),
            poss_lost_ctrl: numberValue(stats.possLost),
            blocked_cross: numberValue(stats.blockedCross),
            fouls: numberValue(stats.fouls),
            yellow_card: numberValue(stats.cards),
            goals_conceded: numberValue(stats.goalsConceded),
            saves: numberValue(stats.saves),
            dive_catch: numberValue(stats.diveCatch),
            good_high_clam: numberValue(stats.crossClaimed),
            cross_not_claimed: numberValue(stats.crossNotClaimed),
            punches: numberValue(stats.punches),
            accurate_long_balls: numberValue(stats.longBalls)
        },
        decisiveInputs: {
            dec_goal: numberValue(stats.goals),
            dec_assist: numberValue(stats.assists),
            dec_clean_sheet: numberValue(stats.cleanSheet),
            dec_penalty_save: numberValue(stats.penaltySaved)
        }
    };
}

function buildAnalysisPrompt(body) {
    const playerNumber = body.playerNumber || "[PLAYER_NUMBER]";
    const position = body.position || "mid";
    const teamColor = body.teamColor || "unknown";
    const opponentColor = body.opponentColor || "unknown";
    const playerDescription = body.playerDescription || "not provided";
    const startingLocation = body.startingLocation || "not provided";
    const analysisDepth = body.analysisDepth || "fast";
    const extraInstructions = body.extraInstructions || "none";
    const clientPrompt = body.prompt || "";
    const playerLock = normalizePlayerLock(parseMaybeJson(body.playerLock, {}), body);
    const correctionMemory = Array.isArray(body.correctionMemory) ? body.correctionMemory : [];
    const correctionMemoryGuide = body.correctionMemoryGuide || compileCorrectionMemoryGuide(body);
    const trackerContext = body.trackerContext || null;
    const depthRules = {
        fast: "FAST MODE: prioritize identifying the player and counting key stats. Keep eventLog to only major events. Prefer speed over exhaustive touches.",
        balanced: "BALANCED MODE: track the player carefully and include a useful eventLog, but keep it concise.",
        detailed: "DETAILED MODE: be more exhaustive, include more eventLog entries, and spend extra effort checking stat consistency."
    };

    return `You are a careful soccer video analysis agent and performance analyst. Your job is to create calculator-ready stats from a soccer match video.

Analyze the full match video and track only player #${playerNumber}.

Highest priority instruction:
- The user's written description/notes are authoritative when the jersey number is hard to read.
- If the user says which player is #${playerNumber}, lock onto that described player and keep tracking that same player by body/position/team continuity.
- Do not switch to another #${playerNumber} or another similar-looking player unless the video clearly proves the original target was wrong.

Context:
- Player number: ${playerNumber}
- Player position: ${position}
- Player team color: ${teamColor}
- Opponent color: ${opponentColor}
- Player description: ${playerDescription}
- Starting location / first sighting: ${startingLocation}
- Analysis depth: ${analysisDepth}
- Extra notes: ${extraInstructions}

Player Lock Profile:
${JSON.stringify(playerLock, null, 2)}

Recent Correction Lessons:
${correctionMemory.length ? JSON.stringify(correctionMemory, null, 2) : "No previous correction lessons saved yet."}

Correction Memory Guide:
${compactJson(correctionMemoryGuide, 6000)}

OpenCV Tracker Context:
${trackerContext ? compactJson(trackerContext) : "No OpenCV tracker context was produced for this request."}

Mode:
${depthRules[analysisDepth] || depthRules.fast}

Important rules:
- Count only actions by player #${playerNumber}.
- Before counting stats, apply the Player Lock Profile as the tracking fingerprint: number, kit color, body shape, boot/sleeve clues, starting field zone, position, nearby teammates, and direction of play.
- Use a computer-vision-style tracking workflow before counting stats:
  1. Create a target fingerprint from jersey number, kit color, body shape, hair/boots/sleeves, role, starting zone, and nearby teammates.
  2. Split the video mentally into short tracklets between camera cuts, throw-ins, set pieces, and zoom changes.
  3. At the start of each tracklet, re-identify the target from the fingerprint before counting any event.
  4. Maintain continuity by checking field zone, movement direction, speed, posture, and tactical role.
  5. Reject lookalike players if their zone, role, body clues, or movement path does not match the locked target.
  6. If identity confidence drops below medium, pause counting and list the timestamp in uncertainty.
- If #${playerNumber} is blurry, rely on player description, starting location, field role, and continuity more than number visibility.
- If the lock profile conflicts with a blurry number, follow the lock profile and mark uncertainty instead of switching players.
- Re-check the target after camera cuts, throw-ins, substitutions, set pieces, and half-time direction changes.
- Do not count actions when you lose the player. Mark those moments as uncertainty instead.
- For every counted event, first ask: "Am I still on the locked player?" If not, do not count it.
- Prefer undercounting with clear uncertainty over counting actions from the wrong player.
- If OpenCV Tracker Context is available and ok=true, use likelyTargetTrack, topTracks, commonZones, and sampleBoxes as visual tracking evidence. Treat it as guidance, not final truth.
- If OpenCV Tracker Context is unavailable or ok=false, continue with Gemini-only tracking and explain the missing tracker in notes only if it affected confidence.
- For passes: passesCompleted means completed passes only; passes means all attempted passes.
- For blockedCross: count crosses blocked by the target player, including attackers defending corners.
- For turnovers: include dispossessions, bad touches losing control, missed passes that give possession away, and failed dribbles.
- For duels: count visible contested ground/aerial challenges as won or lost.
- For possWon/possLost: count possession recoveries/wins and clear losses of possession/control.
- For goalkeeper stats, only fill keeper fields if the player is the goalkeeper.
- Apply the Correction Memory Guide before returning final JSON. Treat guide.directives as required audit checks, not casual style notes.
- If guide.statBias says previous AI undercounted a stat, actively search the video/eventLog for missed examples of that stat before finalizing.
- If guide.statBias says previous AI overcounted a stat, remove weak/uncertain examples of that stat unless clearly visible.
- Always mention any correction-memory uncertainty in notes if it affected the final counts.
- Keep an eventLog with important moments and timestamps where possible.
- If a stat is not visible, estimate conservatively and explain uncertainty in notes.
- Do not include stats for any other player.
- Return valid JSON only. No markdown.

Return this exact JSON shape:
{
  "playerIdentity": "short description of how you identified the player",
  "touches": 0,
  "shots": 0,
  "shotsOnTarget": 0,
  "passes": 0,
  "passesCompleted": 0,
  "turnovers": 0,
  "duelsWon": 0,
  "duelsLost": 0,
  "possWon": 0,
  "possLost": 0,
  "blockedCross": 0,
  "fouls": 0,
  "cards": 0,
  "goals": 0,
  "assists": 0,
  "goalsConceded": 0,
  "saves": 0,
  "diveCatch": 0,
  "crossClaimed": 0,
  "crossNotClaimed": 0,
  "punches": 0,
  "longBalls": 0,
  "cleanSheet": 0,
  "penaltySaved": 0,
  "confidence": "low|medium|high",
  "trackingConfidence": "low|medium|high",
  "uncertainty": ["short uncertainty note"],
  "eventLog": [
    {
      "time": "MM:SS or HH:MM:SS",
      "type": "pass|shot|duel|turnover|touch|goal|assist|save|foul|card|possession|other",
      "outcome": "completed|missed|won|lost|on target|off target|success|failed|unknown",
      "description": "short event description"
    }
  ],
  "notes": "short explanation with timestamps when possible"
}

Additional client prompt:
${clientPrompt}`;
}

function buildCorrectionReflectionPrompt(payload) {
    return `You are improving a soccer video stat-tracking agent.

The app user corrected the AI's stat output. Analyze the difference and write a short lesson the future video agent should follow.

Context:
${JSON.stringify(payload.context || {}, null, 2)}

AI original stats:
${JSON.stringify(payload.originalStats || {}, null, 2)}

User corrected stats:
${JSON.stringify(payload.correctedStats || {}, null, 2)}

Stat differences:
${JSON.stringify(payload.differences || [], null, 2)}

Return valid JSON only with this shape:
{
  "summary": "one short sentence explaining what changed",
  "likelyMistake": "why the AI probably got it wrong",
  "lesson": "specific instruction to improve future analysis",
  "preventNextTime": ["short rule 1", "short rule 2", "short rule 3"],
  "watchStats": ["statKey1", "statKey2"]
}`;
}

function buildPlayerLockPrompt(body) {
    const playerNumber = body.playerNumber || "[PLAYER_NUMBER]";
    const position = body.position || "unknown";
    const teamColor = body.teamColor || "unknown";
    const opponentColor = body.opponentColor || "unknown";
    const playerDescription = body.playerDescription || "not provided";
    const startingLocation = body.startingLocation || "not provided";
    const extraInstructions = body.extraInstructions || "none";

    return `You are a soccer video tracking assistant. Your only job is to create a Player Lock Profile for one target player before full stat analysis.

Target:
- Player number: ${playerNumber}
- Position: ${position}
- Team color: ${teamColor}
- Opponent color: ${opponentColor}
- User description: ${playerDescription}
- Starting location / first sighting: ${startingLocation}
- Extra notes: ${extraInstructions}

Instructions:
- Identify the target player using the user's clues, visible number, team kit, body shape, boots/sleeves, role, field zone, and movement continuity.
- If the jersey number is hard to read, the user's written description is authoritative.
- Build the lock like a computer-vision tracker would:
  1. Find the first reliable sighting.
  2. Describe the player's visual fingerprint.
  3. Describe their starting field zone and normal movement lanes.
  4. List lookalike teammates who could be confused with them.
  5. Write re-lock rules for camera cuts, set pieces, and half-time direction changes.
- Build a profile that another AI pass can use to keep tracking the same player after camera cuts.
- Do not count full match stats here. Only create the lock profile.
- Return valid JSON only. No markdown.

Return this exact JSON shape:
{
  "playerNumber": "${playerNumber}",
  "position": "${position}",
  "teamColor": "${teamColor}",
  "opponentColor": "${opponentColor}",
  "playerIdentity": "short description of the target player",
  "lockSummary": "one sentence explaining how to identify and follow this player",
  "primaryClues": ["visible clue 1", "visible clue 2", "visible clue 3"],
  "likelyZones": ["areas of the field this player usually appears"],
  "firstSightings": [
    {
      "time": "MM:SS or HH:MM:SS",
      "description": "where the target is seen"
    }
  ],
  "avoidConfusions": ["similar player or situation to avoid"],
  "relockRules": ["rule for re-identifying after camera cuts"],
  "confidence": "low|medium|high",
  "uncertainty": ["short uncertainty note"]
}`;
}

function buildAuditPrompt(rawJsonText) {
    return `You are auditing soccer stats JSON from a video model.

Fix only JSON structure, stat consistency, and impossible values. Do not invent new events.

Rules:
- Return valid JSON only.
- Keep the same exact JSON shape.
- Every numeric stat must be a non-negative number.
- passesCompleted cannot be greater than passes.
- shotsOnTarget cannot be greater than shots.
- eventLog should remain concise and useful.
- If confidence is missing, set it to "medium".

JSON to audit:
${rawJsonText}`;
}

function buildTwelveLabsPrompt(body) {
    const playerNumber = body.playerNumber || "[PLAYER_NUMBER]";
    const position = body.position || "unknown";
    const trackerContext = body.trackerContext ? compactJson(body.trackerContext, 5000) : "No OpenCV tracker context.";
    const correctionMemoryGuide = body.correctionMemoryGuide || compileCorrectionMemoryGuide(body);

    return `Analyze this soccer video for exactly one target player and return strict JSON only.

Target player:
- Number: ${playerNumber}
- Position: ${position}
- Team color: ${body.teamColor || "unknown"}
- Opponent color: ${body.opponentColor || "unknown"}
- Player description: ${body.playerDescription || "not provided"}
- Starting location / first sighting: ${body.startingLocation || "not provided"}
- Extra notes: ${body.extraInstructions || "none"}
- Player lock: ${body.playerLock || "not provided"}

OpenCV tracker context:
${trackerContext}

Correction memory guide:
${compactJson(correctionMemoryGuide, 5000)}

Rules:
- Count only actions by player #${playerNumber}.
- If you are not sure an action belongs to the target player, do not count it.
- Apply the correction memory guide as a required pre-submit audit. If past corrections undercounted a watched stat, search for missed visible examples before finalizing. If past corrections overcounted a watched stat, remove weak/uncertain examples.
- Prefer conservative counts and explain uncertainty.
- passesCompleted cannot exceed passes.
- shotsOnTarget cannot exceed shots.
- Fill goalkeeper stats only if the target player is a goalkeeper.
- Include timestamps in eventLog when possible.
- Return JSON only, no markdown.

Required JSON shape:
{
  "playerIdentity": "how you identified the target player",
  "touches": 0,
  "shots": 0,
  "shotsOnTarget": 0,
  "passes": 0,
  "passesCompleted": 0,
  "turnovers": 0,
  "duelsWon": 0,
  "duelsLost": 0,
  "possWon": 0,
  "possLost": 0,
  "blockedCross": 0,
  "fouls": 0,
  "cards": 0,
  "goals": 0,
  "assists": 0,
  "goalsConceded": 0,
  "saves": 0,
  "diveCatch": 0,
  "crossClaimed": 0,
  "crossNotClaimed": 0,
  "punches": 0,
  "longBalls": 0,
  "cleanSheet": 0,
  "penaltySaved": 0,
  "confidence": "low|medium|high",
  "trackingConfidence": "low|medium|high",
  "uncertainty": ["short uncertainty note"],
  "eventLog": [
    {
      "time": "MM:SS or HH:MM:SS",
      "type": "pass|shot|duel|turnover|touch|goal|assist|save|foul|card|possession|other",
      "outcome": "completed|missed|won|lost|on target|off target|success|failed|unknown",
      "description": "short event description"
    }
  ],
  "notes": "short explanation"
}`;
}

function buildTwelveLabsResponseSchema() {
    const numberField = { type: "number" };
    const stringField = { type: "string" };
    return {
        type: "object",
        properties: {
            playerIdentity: stringField,
            touches: numberField,
            shots: numberField,
            shotsOnTarget: numberField,
            passes: numberField,
            passesCompleted: numberField,
            turnovers: numberField,
            duelsWon: numberField,
            duelsLost: numberField,
            possWon: numberField,
            possLost: numberField,
            blockedCross: numberField,
            fouls: numberField,
            cards: numberField,
            goals: numberField,
            assists: numberField,
            goalsConceded: numberField,
            saves: numberField,
            diveCatch: numberField,
            crossClaimed: numberField,
            crossNotClaimed: numberField,
            punches: numberField,
            longBalls: numberField,
            cleanSheet: numberField,
            penaltySaved: numberField,
            confidence: stringField,
            trackingConfidence: stringField,
            uncertainty: {
                type: "array",
                items: stringField
            },
            eventLog: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        time: stringField,
                        type: stringField,
                        outcome: stringField,
                        description: stringField
                    }
                }
            },
            notes: stringField
        }
    };
}

function buildTwelveLabsPlayerLockPrompt(body) {
    return `${buildPlayerLockPrompt(body)}

Use the video to create the player lock profile. Do not count match stats. Focus only on how to re-identify this player later. Return JSON only.`;
}

function buildTwelveLabsPlayerLockSchema() {
    const stringField = { type: "string" };
    return {
        type: "object",
        properties: {
            playerNumber: stringField,
            position: stringField,
            teamColor: stringField,
            opponentColor: stringField,
            playerIdentity: stringField,
            lockSummary: stringField,
            primaryClues: {
                type: "array",
                items: stringField
            },
            likelyZones: {
                type: "array",
                items: stringField
            },
            firstSightings: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        time: stringField,
                        description: stringField
                    }
                }
            },
            avoidConfusions: {
                type: "array",
                items: stringField
            },
            relockRules: {
                type: "array",
                items: stringField
            },
            confidence: stringField,
            uncertainty: {
                type: "array",
                items: stringField
            }
        }
    };
}

async function waitForActiveFile(ai, uploadedFile) {
    let file = uploadedFile;
    const maxPolls = Number(process.env.GEMINI_FILE_MAX_POLLS || 120);
    const pollMs = Number(process.env.GEMINI_FILE_POLL_MS || 5000);

    for (let attempt = 0; attempt < maxPolls; attempt += 1) {
        const state = String(file.state || "");
        if (state === "ACTIVE") return file;
        if (state === "FAILED") {
            throw new Error("Gemini file processing failed.");
        }
        await sleep(pollMs);
        file = await ai.files.get({ name: file.name });
    }

    throw new Error("Gemini file processing timed out. Try a shorter clip or increase GEMINI_FILE_MAX_POLLS.");
}

// Mount structured health check endpoint
const serverStartTime = Date.now();
app.use("/api/health", createHealthRouter({
    geminiApiKeys,
    cerebrasApiKey,
    groqApiKey,
    twelveLabsApiKey,
    startTime: serverStartTime
}));

app.post("/api/site-notification", requireTrustedOrigin, notificationLimiter, async (req, res) => {
    const now = new Date();
    const requestedType = safeString(req.body?.type || "guest", 40).toLowerCase();
    const type = ["guest", "signup", "signin", "feedback"].includes(requestedType) ? requestedType : "guest";
    const email = safeString(req.body?.email || (type === "guest" ? "Guest" : "unknown"), 160);
    const payload = {
        type,
        email,
        playerName: safeString(req.body?.playerName || "", 120),
        playerAge: safeNumber(req.body?.playerAge, null, { min: 1, max: 100 }),
        playerPosition: safeString(req.body?.playerPosition || "", 40),
        feedbackMessage: safeString(req.body?.feedbackMessage || "", 2000),
        guestId: safeString(req.body?.guestId || "", 120),
        guestStartedAt: safeString(req.body?.guestStartedAt || "", 80),
        page: safeString(req.body?.page || "", 120),
        localTime: safeString(req.body?.localTime || "", 120),
        timezone: safeString(req.body?.timezone || "", 80),
        userAgent: safeString(req.body?.userAgent || "", 260),
        ip: clientIp(req),
        serverTime: now.toISOString()
    };

    await fs.appendFile(siteNotificationsPath, `${JSON.stringify(payload)}\n`, "utf8");

    const subject = type === "signup"
        ? `New Veyro signup: ${email}`
        : type === "signin"
            ? `Veyro sign in: ${email}`
            : `New Veyro guest: ${now.toLocaleString("en-US", { timeZone: "America/New_York" })}`;
    const message = [
        `Type: ${payload.type}`,
        `Email: ${payload.email}`,
        payload.playerName ? `Player name: ${payload.playerName}` : "",
        payload.playerAge ? `Age: ${payload.playerAge}` : "",
        payload.playerPosition ? `Position: ${payload.playerPosition}` : "",
        payload.feedbackMessage ? `Feedback: ${payload.feedbackMessage}` : "",
        payload.guestId ? `Guest ID: ${payload.guestId}` : "",
        `Server time: ${payload.serverTime}`,
        payload.localTime ? `Visitor local time: ${payload.localTime}` : "",
        payload.timezone ? `Visitor timezone: ${payload.timezone}` : "",
        payload.page ? `Page: ${payload.page}` : "",
        payload.ip ? `IP: ${payload.ip}` : "",
        payload.userAgent ? `Device/browser: ${payload.userAgent}` : ""
    ].filter(Boolean).join("\n");

    if (!siteNotifyBackendEmail) {
        res.json({ ok: true, logged: true, emailed: false, emailMode: "browser-form" });
        return;
    }

    try {
        const emailResult = await notifyByFormSubmit(subject, message);
        res.json({ ok: true, logged: true, emailed: true, emailResult });
    } catch (error) {
        console.error("Site notification email failed:", error);
        res.status(202).json({
            ok: true,
            logged: true,
            emailed: false,
            warning: "Notification was logged, but the email service did not accept it."
        });
    }
});

app.get("/api/tracker-health", requireTrustedOrigin, requireDiagnosticAccess, async (req, res) => {
    if (trackerServiceUrl) {
        try {
            const response = await fetch(`${trackerServiceUrl}/health`);
            const result = await response.json().catch(() => ({}));
            res.status(response.ok ? 200 : 500).json({
                enabled: useOpenCvTracker,
                remote: true,
                trackerServiceUrl,
                result
            });
        } catch (error) {
            res.status(500).json({
                enabled: useOpenCvTracker,
                remote: true,
                trackerServiceUrl,
                result: {
                    ok: false,
                    reason: "Remote tracker health check failed.",
                    message: error.message
                }
            });
        }
        return;
    }

    const result = await runPythonTracker([
        path.join(__dirname, "tracker_service.py"),
        "--health"
    ]);
    res.status(result?.ok === false ? 500 : 200).json({
        enabled: useOpenCvTracker,
        trackerPython,
        result
    });
});

app.get("/api/fast-ai-health", requireTrustedOrigin, requireDiagnosticAccess, async (req, res) => {
    const result = {
        ok: true,
        hasCerebrasKey: Boolean(cerebrasApiKey),
        cerebrasModel,
        hasGroqKey: Boolean(groqApiKey),
        groqModel,
        fastTextProvider,
        tests: {}
    };

    const testPrompt = `Return valid JSON only:
{
  "ok": true,
  "provider": "provider name",
  "message": "fast text test passed"
}`;

    if (cerebrasApiKey) {
        try {
            const test = await callOpenAiCompatibleJson({
                provider: "cerebras",
                url: "https://api.cerebras.ai/v1/chat/completions",
                apiKey: cerebrasApiKey,
                modelName: cerebrasModel,
                prompt: testPrompt,
                system: "Return valid JSON only.",
                maxTokens: 120
            });
            result.tests.cerebras = {
                ok: true,
                model: test.model,
                response: test.json
            };
        } catch (error) {
            result.ok = false;
            result.tests.cerebras = {
                ok: false,
                error: error.message
            };
        }
    }

    if (groqApiKey) {
        try {
            const test = await callOpenAiCompatibleJson({
                provider: "groq",
                url: "https://api.groq.com/openai/v1/chat/completions",
                apiKey: groqApiKey,
                modelName: groqModel,
                prompt: testPrompt,
                system: "Return valid JSON only.",
                maxTokens: 120
            });
            result.tests.groq = {
                ok: true,
                model: test.model,
                response: test.json
            };
        } catch (error) {
            result.ok = false;
            result.tests.groq = {
                ok: false,
                error: error.message
            };
        }
    }

    res.status(result.ok ? 200 : 500).json(result);
});

app.get("/api/security-events", requireTrustedOrigin, requireDiagnosticAccess, async (req, res) => {
    const limit = envNumber("SECURITY_EVENTS_LIMIT", 80, { min: 1, max: 300 });
    try {
        const text = await fs.readFile(securityEventsPath, "utf8").catch(error => {
            if (error.code === "ENOENT") return "";
            throw error;
        });
        const events = text
            .trim()
            .split("\n")
            .filter(Boolean)
            .slice(-limit)
            .map(line => JSON.parse(line))
            .reverse()
            .map(event => ({
                type: redactForLog(event.type || ""),
                path: redactForLog(event.path || "", 180),
                method: redactForLog(event.method || "", 12),
                origin: redactForLog(event.origin || "", 180),
                ip: event.ip ? `${String(event.ip).split(".").slice(0, 2).join(".")}.*.*` : "",
                userAgent: redactForLog(event.userAgent || "", 180),
                details: event.details || {},
                createdAt: event.createdAt || ""
            }));
        res.json({ ok: true, events });
    } catch (error) {
        console.error("Could not read security events:", error);
        res.status(500).json({
            ok: false,
            error: "Security events could not load."
        });
    }
});

function handleUploadError(error, req, res, next) {
    if (error?.code === "LIMIT_FILE_SIZE") {
        cleanupUploadedFile(req);
        res.status(413).json({
            error: "Video file is too large.",
            message: `The backend upload limit is ${maxVideoMb} MB. Compress the video, upload a shorter clip, or raise MAX_VIDEO_MB in .env and restart npm start.`
        });
        return;
    }

    if (String(error?.code || "").startsWith("LIMIT_")) {
        cleanupUploadedFile(req);
        logSecurityEvent("rejected-upload-limit", req, {
            code: error.code,
            message: redactForLog(error.message || "")
        });
        res.status(400).json({
            error: "Upload request is too large.",
            message: "Please upload one video and keep the form fields short."
        });
        return;
    }

    if (error?.code === "INVALID_VIDEO_TYPE") {
        cleanupUploadedFile(req);
        res.status(415).json({
            error: "Unsupported upload type.",
            message: "Please upload a video file such as MP4, MOV, AVI, MKV, WebM, or MPEG."
        });
        return;
    }

    next(error);
}

app.post("/api/player-lock", requireTrustedOrigin, requireVideoAiEntitlement, videoAiLimiter, upload.single("video"), handleUploadError, async (req, res) => {
    req.body = sanitizeVideoRequestBody(req.body || {});
    if (!geminiApiKeys.length && !twelveLabsApiKey) {
        res.status(500).json({ error: "Missing player lock AI key. Add TWELVELABS_API_KEY or GEMINI_API_KEY in environment variables." });
        return;
    }

    if (!req.file) {
        res.status(400).json({ error: "Missing video file." });
        return;
    }

    try {
        await assertUploadedVideoLooksSafe(req);
    } catch (error) {
        await cleanupUploadedFile(req);
        res.status(error.statusCode || 415).json({
            error: "Unsupported upload type.",
            message: "The uploaded file does not look like a supported video. Please upload a real MP4, MOV, AVI, MKV, WebM, or MPEG video."
        });
        return;
    }

    const fileSize = Number(req.file.size || 0);
    const twelveLabsMaxBytes = twelveLabsMaxMb * 1024 * 1024;
    if (fileSize > geminiMaxFileBytes && (!twelveLabsApiKey || fileSize > twelveLabsMaxBytes)) {
        await fs.unlink(req.file.path).catch(() => {});
        res.status(413).json({
            error: "Video is too large for the available player-lock providers.",
            message: `Gemini supports videos up to 2 GB. TwelveLabs is configured for up to ${twelveLabsMaxMb} MB. Compress the video or split the match into smaller clips.`
        });
        return;
    }

    const localPath = req.file.path;
    const attempts = twelveLabsApiKey && fileSize > geminiMaxFileBytes
        ? ["twelvelabs"]
        : twelveLabsApiKey
            ? ["twelvelabs", "gemini"]
            : ["gemini"];
    const failures = [];

    try {
        let result = null;
        for (const provider of attempts) {
            try {
                if (provider === "twelvelabs") {
                    result = await playerLockWithTwelveLabs(localPath, req.body, safeFileName(req.file.originalname));
                } else {
                    if (!geminiApiKeys.length) throw new Error("GEMINI_API_KEY is not configured.");
                    result = await runWithGeminiFallback(async ai => {
                        const uploadedVideo = await ai.files.upload({
                            file: localPath,
                            config: {
                                mimeType: req.file.mimetype || "video/mp4",
                                displayName: `player-lock-${safeFileName(req.file.originalname)}`
                            }
                        });

                        const activeVideo = await waitForActiveFile(ai, uploadedVideo);
                        const response = await ai.models.generateContent({
                            model,
                            contents: [
                                createUserContent([
                                    createPartFromUri(activeVideo.uri, activeVideo.mimeType),
                                    buildPlayerLockPrompt(req.body)
                                ])
                            ],
                            config: {
                                responseMimeType: "application/json"
                            }
                        });

                        const parsed = JSON.parse(cleanJsonText(response.text));
                        return {
                            playerLock: {
                                ...normalizePlayerLock(parsed, req.body),
                                source: "gemini-player-lock"
                            },
                            provider: "gemini",
                            providerModel: model,
                            file: {
                                name: activeVideo.name,
                                uri: activeVideo.uri,
                                mimeType: activeVideo.mimeType
                            }
                        };
                    });
                }
                break;
            } catch (error) {
                failures.push({
                    provider,
                    message: error.message
                });
                console.warn(`${provider} player lock failed.`, error.message);
            }
        }

        if (!result) {
            throw new Error(`All player lock providers failed. ${failures.map(item => `${item.provider}: ${item.message}`).join(" | ")}`);
        }

        res.json({
            ...result,
            model: result.providerModel || model,
            providerFailures: publicProviderFailures(failures)
        });
    } catch (error) {
        console.error("Player lock failed:", error);
        res.status(500).json({
            error: "Player lock failed.",
            message: publicErrorMessage(error, "Player lock could not finish. Try a shorter clip or try again later.")
        });
    } finally {
        await fs.unlink(localPath).catch(() => {});
    }
});

app.post("/api/video-correction", requireTrustedOrigin, correctionLimiter, async (req, res) => {
    const originalStats = normalizeStats(req.body.originalStats || {}, 80);
    const correctedStats = normalizeStats(req.body.correctedStats || {}, 80);
    const differences = summarizeStatDifferences(originalStats, correctedStats);
    const context = {
        playerNumber: safeString(req.body.context?.playerNumber),
        position: safeString(req.body.context?.position),
        teamColor: safeString(req.body.context?.teamColor),
        opponentColor: safeString(req.body.context?.opponentColor),
        playerDescription: safeString(req.body.context?.playerDescription),
        startingLocation: safeString(req.body.context?.startingLocation),
        analysisDepth: safeString(req.body.context?.analysisDepth),
        extraInstructions: safeString(req.body.context?.extraInstructions, 800),
        playerLock: req.body.context?.playerLock || null
    };

    if (!differences.length) {
        res.json({
            saved: false,
            lesson: {
                summary: "No stat changes were made.",
                likelyMistake: "The corrected output matched the original output.",
                lesson: "No new correction lesson was needed.",
                preventNextTime: [],
                watchStats: []
            },
            differences: []
        });
        return;
    }

    let lesson = {
        summary: "Correction saved.",
        likelyMistake: "The model likely missed or overcounted visible events.",
        lesson: "Review the corrected stat keys more carefully in future clips.",
        preventNextTime: differences.slice(0, 3).map(item => `Double-check ${item.key}: AI ${item.before}, corrected ${item.after}.`),
        watchStats: differences.slice(0, 5).map(item => item.key)
    };

    const reflectionPrompt = buildCorrectionReflectionPrompt({
        context,
        originalStats,
        correctedStats,
        differences
    });

    if (cerebrasApiKey || groqApiKey) {
        try {
            const reflection = await runFastTextJson(reflectionPrompt, {
                prefer: fastTextProvider,
                system: "You write concise soccer video-analysis correction lessons. Return valid JSON only.",
                maxTokens: 900
            });
            lesson = {
                ...lesson,
                ...reflection.json,
                provider: reflection.provider,
                model: reflection.model
            };
        } catch (error) {
            console.error("Fast correction reflection failed:", error);
        }
    }

    if (!lesson.provider && geminiApiKeys.length) {
        try {
            const reflection = await runWithGeminiFallback(async ai => {
                const reflectionResponse = await ai.models.generateContent({
                    model,
                    contents: createUserContent(reflectionPrompt),
                    config: {
                        responseMimeType: "application/json"
                    }
                });
                return {
                    lesson: JSON.parse(cleanJsonText(reflectionResponse.text))
                };
            });
            lesson = {
                ...lesson,
                ...reflection.lesson,
                provider: "gemini",
                model
            };
        } catch (error) {
            console.error("Gemini correction reflection failed:", error);
        }
    }

    const record = {
        createdAt: new Date().toISOString(),
        context,
        differences,
        lesson
    };

    try {
        await saveCorrectionRecord(record);
        res.json({
            saved: true,
            lesson,
            differences
        });
    } catch (error) {
        console.error("Correction save failed:", error);
        res.status(500).json({
            error: "Correction could not be saved.",
            message: error.message,
            lesson,
            differences
        });
    }
});

app.post("/api/analyze-video", requireTrustedOrigin, requireVideoAiEntitlement, videoAiLimiter, upload.single("video"), handleUploadError, async (req, res) => {
    req.body = sanitizeVideoRequestBody(req.body || {});
    const preferredProvider = String(req.body.provider || "twelvelabs").toLowerCase();
    if (!geminiApiKeys.length && !twelveLabsApiKey) {
        res.status(500).json({ error: "Missing video AI key. Add TWELVELABS_API_KEY or GEMINI_API_KEY in environment variables." });
        return;
    }

    if (!req.file) {
        res.status(400).json({ error: "Missing video file." });
        return;
    }

    try {
        await assertUploadedVideoLooksSafe(req);
    } catch (error) {
        await cleanupUploadedFile(req);
        res.status(error.statusCode || 415).json({
            error: "Unsupported upload type.",
            message: "The uploaded file does not look like a supported video. Please upload a real MP4, MOV, AVI, MKV, WebM, or MPEG video."
        });
        return;
    }

    const fileSize = Number(req.file.size || 0);
    const twelveLabsMaxBytes = twelveLabsMaxMb * 1024 * 1024;
    if (fileSize > geminiMaxFileBytes && (!twelveLabsApiKey || fileSize > twelveLabsMaxBytes)) {
        await fs.unlink(req.file.path).catch(() => {});
        res.status(413).json({
            error: "Video is too large for the available analysis providers.",
            message: `Gemini supports videos up to 2 GB. TwelveLabs is configured for up to ${twelveLabsMaxMb} MB. Compress the video or split the match into smaller clips.`
        });
        return;
    }

    const localPath = req.file.path;
    const analysisDepth = req.body.analysisDepth || "fast";
    const maxEvents = analysisDepth === "detailed" ? 220 : analysisDepth === "balanced" ? 140 : 70;
    const useAuditPass = defaultAuditPass || analysisDepth === "detailed";
    const attempts = fileSize > geminiMaxFileBytes
        ? ["twelvelabs"]
        : preferredProvider === "gemini"
        ? ["gemini", "twelvelabs"]
        : preferredProvider === "twelvelabs"
            ? ["twelvelabs", "gemini"]
            : ["twelvelabs", "gemini"];
    const failures = [];

    try {
        req.body.correctionMemory = await loadRecentCorrectionLessons();
        req.body.correctionMemoryGuide = compileCorrectionMemoryGuide(req.body);
        req.body.trackerContext = await buildTrackerContext(localPath, req.body);

        let result = null;
        for (const provider of attempts) {
            try {
                if (provider === "twelvelabs") {
                    if (!twelveLabsApiKey) throw new Error("TWELVELABS_API_KEY is not configured.");
                    result = await analyzeWithTwelveLabs(localPath, req.body, safeFileName(req.file.originalname), maxEvents);
                } else if (provider === "gemini") {
                    if (!geminiApiKeys.length) throw new Error("GEMINI_API_KEY is not configured.");
                    result = await analyzeWithGemini(
                        localPath,
                        req.body,
                        safeFileName(req.file.originalname),
                        req.file.mimetype || "video/mp4",
                        maxEvents,
                        useAuditPass
                    );
                }
                break;
            } catch (error) {
                failures.push({
                    provider,
                    message: error.message
                });
                console.warn(`${provider} video analysis failed.`, error.message);
            }
        }

        if (!result) {
            throw new Error(`All video providers failed. ${failures.map(item => `${item.provider}: ${item.message}`).join(" | ")}`);
        }

        res.json({
            ...result,
            model: result.providerModel || model,
            audited: useAuditPass,
            tracker: req.body.trackerContext,
            correctionMemoryGuide: req.body.correctionMemoryGuide,
            preferredProvider,
            providerFailures: publicProviderFailures(failures)
        });
    } catch (error) {
        console.error("Video analysis failed:", error);
        res.status(500).json({
            error: "Video analysis failed.",
            message: publicErrorMessage(error, "The analysis engine did not finish this request. Try a shorter clip or try again later.")
        });
    } finally {
        await fs.unlink(localPath).catch(() => {});
    }
});

if (hasReactBuild) {
    app.get(/^\/(?!api(?:\/|$)|robots\.txt$|sitemap\.xml$|\.well-known\/|.*\.[^/]+$).*/, (req, res) => {
        res.sendFile(reactIndexPath);
    });
}

app.use((error, req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    cleanupUploadedFile(req);
    const message = error?.message || "Unexpected server error.";
    const status = Number(error?.statusCode || 0)
        || (message.includes("CORS origin is not allowed") ? 403 : 500);
    console.error("Request failed:", message);
    res.status(status).json({
        error: status === 403
            ? "Request origin is not allowed."
            : status === 415
                ? "Unsupported upload type."
                : "Server error.",
        message: status === 403
            ? "This website is not allowed to call the Veyro backend."
            : status === 415
                ? "Please upload a supported video file."
            : "Something went wrong on the server."
    });
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Veyro backend running at http://localhost:${port}`);
    console.log(`Video AI endpoint: http://localhost:${port}/api/analyze-video`);
});
