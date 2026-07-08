import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ignored = new Set(["node_modules", "dist", ".git", "uploads", "data", "package-lock.json"]);
const ignoredFiles = new Set([".env", ".env.local"]);
const publicFirebaseConfigFiles = new Set(["firebase-config.js", path.join("react", "src", "lib", "firebase.js")]);
const patterns = [
    { name: "Google API key", regex: /AIza[0-9A-Za-z_-]{35}/g },
    { name: "Stripe live secret key", regex: /sk_live_[0-9A-Za-z]{20,}/g },
    { name: "Stripe restricted live key", regex: /rk_live_[0-9A-Za-z]{20,}/g },
    { name: "Firebase private key", regex: new RegExp("-----BEGIN " + "PRIVATE KEY-----", "g") }
];

function walk(dir) {
    const full = path.resolve(dir);
    const stat = statSync(full, { throwIfNoEntry: false });
    if (!stat) return [];
    if (stat.isFile()) return [full];
    if (!stat.isDirectory() || ignored.has(path.basename(full))) return [];
    return readdirSync(full).flatMap(item => walk(path.join(full, item)));
}

const files = walk(".");
const findings = [];

for (const file of files) {
    const relative = path.relative(process.cwd(), file);
    if (ignoredFiles.has(relative)) continue;
    if (!/\.(js|jsx|mjs|json|md|html|css|rules|yml|yaml|env|txt)$/i.test(file)) continue;
    const text = readFileSync(file, "utf8");
    for (const pattern of patterns) {
        if (pattern.name === "Google API key" && publicFirebaseConfigFiles.has(relative)) {
            continue;
        }
        if (pattern.regex.test(text)) {
            findings.push(`${pattern.name}: ${relative}`);
        }
        pattern.regex.lastIndex = 0;
    }
}

if (findings.length) {
    console.error("Potential secrets found:\n" + findings.join("\n"));
    process.exit(1);
}

console.log(`Secret scan passed across ${files.length} files.`);
