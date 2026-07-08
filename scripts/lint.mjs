import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ignored = new Set(["node_modules", "dist", ".git", "uploads", "data"]);
const roots = ["server.js", "routes", "lib", "react/src", "tests", "scripts"];
const checks = [
    { name: "merge conflict marker", regex: /^(<<<<<<<|=======|>>>>>>>) /m },
    { name: "focused test", regex: /\b(?:describe|it|test)\.only\s*\(/ },
    { name: "debugger statement", regex: /\bdebugger\s*;/ }
];

function collectFiles(target) {
    const full = path.resolve(target);
    const stat = statSync(full, { throwIfNoEntry: false });
    if (!stat) return [];
    if (stat.isFile()) return /\.(mjs|js|jsx|json|md|html|css|rules|yml|yaml)$/i.test(full) ? [full] : [];
    if (!stat.isDirectory() || ignored.has(path.basename(full))) return [];
    return readdirSync(full).flatMap(item => collectFiles(path.join(full, item)));
}

const files = roots.flatMap(collectFiles);
const findings = [];

for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const check of checks) {
        if (check.regex.test(text)) {
            findings.push(`${check.name}: ${path.relative(process.cwd(), file)}`);
        }
    }
}

if (findings.length) {
    console.error("Lint findings:\n" + findings.join("\n"));
    process.exit(1);
}

console.log(`Lint passed: scanned ${files.length} files.`);
