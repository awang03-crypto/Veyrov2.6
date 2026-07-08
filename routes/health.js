/**
 * Health check endpoint for monitoring.
 * Exposes server status, memory usage, and AI provider availability.
 */
import { Router } from "express";

export default function createHealthRouter(options = {}) {
    const {
        geminiApiKeys = [],
        cerebrasApiKey = "",
        groqApiKey = "",
        twelveLabsApiKey = "",
        startTime = Date.now()
    } = options;

    const router = Router();

    router.get("/", (req, res) => {
        const memory = process.memoryUsage();
        res.json({
            status: "ok",
            uptime: Math.floor((Date.now() - startTime) / 1000),
            uptimeHuman: formatUptime(Date.now() - startTime),
            memory: {
                heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + "MB",
                heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + "MB",
                rss: Math.round(memory.rss / 1024 / 1024) + "MB"
            },
            providers: {
                gemini: geminiApiKeys.length > 0,
                geminiKeyCount: geminiApiKeys.length,
                cerebras: !!cerebrasApiKey,
                groq: !!groqApiKey,
                twelveLabs: !!twelveLabsApiKey
            },
            node: process.version,
            env: process.env.NODE_ENV || "development",
            timestamp: new Date().toISOString()
        });
    });

    router.get("/ping", (req, res) => {
        res.status(200).type("text/plain").send("pong");
    });

    return router;
}

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours % 24 > 0) parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
    if (seconds % 60 > 0) parts.push(`${seconds % 60}s`);
    return parts.join(" ") || "0s";
}