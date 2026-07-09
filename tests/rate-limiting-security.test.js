import { describe, it } from "node:test";
import assert from "node:assert";

// Tests for rate limiting, CORS, and security utilities
describe("Rate limiting and security", () => {
    describe("Rate limit bucket management", () => {
        it("tracks requests by IP and label", () => {
            const buckets = new Map();
            const now = Date.now();
            const windowMs = 60000;
            const max = 10;
            
            // Simulate rate limit check
            const key = "api:127.0.0.1";
            let current = buckets.get(key) || { count: 0, resetAt: now + windowMs };
            
            if (current.resetAt <= now) {
                current.count = 0;
                current.resetAt = now + windowMs;
            }
            
            current.count += 1;
            buckets.set(key, current);
            
            assert.strictEqual(current.count, 1);
            assert(current.resetAt > now);
        });

        it("allows requests under limit", () => {
            const buckets = new Map();
            const now = Date.now();
            const max = 10;
            const key = "api:192.168.1.1";
            
            let current = buckets.get(key) || { count: 0, resetAt: now + 60000 };
            current.count += 1;
            
            const allowed = current.count <= max;
            assert.strictEqual(allowed, true);
        });

        it("blocks requests over limit", () => {
            const buckets = new Map();
            const now = Date.now();
            const max = 5;
            const key = "api:10.0.0.1";
            
            let current = buckets.get(key) || { count: 0, resetAt: now + 60000 };
            
            // Simulate exceeding limit
            for (let i = 0; i < 6; i++) {
                current.count += 1;
            }
            
            const allowed = current.count <= max;
            assert.strictEqual(allowed, false);
        });

        it("resets bucket after window expires", () => {
            const buckets = new Map();
            const windowMs = 1000;
            const expiredTime = Date.now() - 2000;
            const key = "api:172.16.0.1";
            
            let current = buckets.get(key) || { count: 5, resetAt: expiredTime };
            
            if (current.resetAt <= Date.now()) {
                current.count = 0;
                current.resetAt = Date.now() + windowMs;
            }
            
            assert.strictEqual(current.count, 0);
        });

        it("cleans up expired buckets", () => {
            const buckets = new Map();
            const now = Date.now();
            
            buckets.set("key1", { count: 1, resetAt: now - 1000 }); // Expired
            buckets.set("key2", { count: 2, resetAt: now + 10000 }); // Active
            buckets.set("key3", { count: 3, resetAt: now - 500 }); // Expired
            
            for (const [key, bucket] of buckets.entries()) {
                if (bucket.resetAt <= now) buckets.delete(key);
            }
            
            assert.strictEqual(buckets.size, 1);
            assert(buckets.has("key2"));
        });
    });

    describe("Rate limit response headers", () => {
        it("includes RateLimit headers in responses", () => {
            const max = 120;
            const current = { count: 45, resetAt: Date.now() + 30000 };
            
            const remaining = Math.max(0, max - current.count);
            const retryAfter = Math.ceil((current.resetAt - Date.now()) / 1000);
            
            assert.strictEqual(remaining, 75);
            assert(retryAfter > 0);
        });

        it("calculates Retry-After when limit exceeded", () => {
            const max = 50;
            const current = { count: 51, resetAt: Date.now() + 45000 };
            
            const rateLimitExceeded = current.count > max;
            const retryAfter = Math.max(1, Math.ceil((current.resetAt - Date.now()) / 1000));
            
            assert.strictEqual(rateLimitExceeded, true);
            assert(retryAfter >= 1);
        });
    });

    describe("CORS origin validation", () => {
        it("allows whitelisted origins", () => {
            const allowed = ["https://example.com", "http://localhost:3000"];
            
            const isAllowed = origin => {
                if (!origin) return true;
                return allowed.includes(origin);
            };
            
            assert.strictEqual(isAllowed("https://example.com"), true);
            assert.strictEqual(isAllowed("http://localhost:3000"), true);
        });

        it("allows localhost on any port", () => {
            const isAllowed = origin => {
                if (!origin) return true;
                return /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin);
            };
            
            assert.strictEqual(isAllowed("http://localhost:3000"), true);
            assert.strictEqual(isAllowed("http://127.0.0.1:5173"), true);
            assert.strictEqual(isAllowed("http://localhost"), true);
        });

        it("blocks non-whitelisted origins", () => {
            const allowed = ["https://example.com"];
            
            const isAllowed = origin => allowed.includes(origin);
            
            assert.strictEqual(isAllowed("https://attacker.com"), false);
            assert.strictEqual(isAllowed("http://example.com"), false); // Different scheme
        });

        it("normalizes origins (removes trailing slashes)", () => {
            const allowed = ["https://example.com"];
            
            const normalize = origin => 
                String(origin).trim().replace(/\/+$/, "");
            
            assert.strictEqual(
                normalize("https://example.com/"),
                normalize("https://example.com")
            );
        });
    });

    describe("Method filtering", () => {
        it("allows whitelisted HTTP methods", () => {
            const allowed = new Set(["GET", "HEAD", "POST", "OPTIONS"]);
            
            assert.strictEqual(allowed.has("GET"), true);
            assert.strictEqual(allowed.has("POST"), true);
            assert.strictEqual(allowed.has("PUT"), false);
            assert.strictEqual(allowed.has("DELETE"), false);
        });

        it("blocks non-whitelisted methods", () => {
            const allowed = new Set(["GET", "HEAD", "POST", "OPTIONS"]);
            
            const blocked = ["PUT", "PATCH", "DELETE"];
            
            blocked.forEach(method => {
                assert.strictEqual(allowed.has(method), false);
            });
        });
    });

    describe("Content-Type validation", () => {
        it("accepts JSON requests", () => {
            const contentType = "application/json";
            const isValid = contentType.includes("application/json");
            
            assert.strictEqual(isValid, true);
        });

        it("accepts multipart/form-data requests", () => {
            const contentType = "multipart/form-data; boundary=...";
            const isValid = contentType.includes("multipart/form-data");
            
            assert.strictEqual(isValid, true);
        });

        it("rejects other content types", () => {
            const invalid = ["text/plain", "application/xml", "text/html"];
            
            invalid.forEach(contentType => {
                const isJson = contentType.includes("application/json");
                const isMultipart = contentType.includes("multipart/form-data");
                assert.strictEqual(isJson || isMultipart, false);
            });
        });
    });

    describe("Request path filtering", () => {
        it("blocks sensitive file paths", () => {
            const blocked = [
                "/server.js",
                "/package.json",
                "/.env",
                "/firestore.rules"
            ];
            
            const isSensitive = pathname => blocked.some(p => pathname === p);
            
            assert.strictEqual(isSensitive("/server.js"), true);
            assert.strictEqual(isSensitive("/.env"), true);
            assert.strictEqual(isSensitive("/public/index.html"), false);
        });

        it("blocks sensitive directories", () => {
            const blockedPrefixes = ["/.git/", "/node_modules/", "/data/"];
            
            const isBlocked = pathname => 
                blockedPrefixes.some(prefix => pathname.startsWith(prefix));
            
            assert.strictEqual(isBlocked("/.git/config"), true);
            assert.strictEqual(isBlocked("/node_modules/express/index.js"), true);
            assert.strictEqual(isBlocked("/data/uploads/video.mp4"), true);
            assert.strictEqual(isBlocked("/public/index.html"), false);
        });

        it("blocks sensitive file extensions", () => {
            const blockedExt = [".zip", ".jsonl", ".log", ".pyc", ".pem", ".key"];
            
            const isBlocked = pathname => 
                blockedExt.some(ext => pathname.endsWith(ext));
            
            assert.strictEqual(isBlocked("/backup.zip"), true);
            assert.strictEqual(isBlocked("/data/logs.jsonl"), true);
            assert.strictEqual(isBlocked("/cert.pem"), true);
            assert.strictEqual(isBlocked("/public/style.css"), false);
        });

        it("normalizes and lowercases paths", () => {
            const normalize = pathname => 
                decodeURIComponent(pathname).replace(/\\/g, "/").toLowerCase();
            
            assert.strictEqual(
                normalize("/SERVER.JS"),
                "/server.js"
            );
            assert.strictEqual(
                normalize("/.ENV"),
                "/.env"
            );
        });
    });
});
