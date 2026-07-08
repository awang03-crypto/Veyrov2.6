import { spawnSync } from "node:child_process";

const minLineCoverage = Number(process.env.COVERAGE_MIN_LINES || 70);

const result = spawnSync(process.execPath, [
    "--test",
    "--test-concurrency=1",
    "--experimental-test-coverage",
    "tests/**/*.test.js"
], {
    cwd: process.cwd(),
    encoding: "utf8"
});

const output = `${result.stdout || ""}${result.stderr || ""}`;
process.stdout.write(output);

if (result.status !== 0) {
    process.exit(result.status || 1);
}

const match = output.match(/all files\s+\|\s+([0-9.]+)\s+\|/i);
if (!match) {
    console.error("Could not find the all-files line coverage number in the Node coverage report.");
    process.exit(1);
}

const lineCoverage = Number(match[1]);
if (!Number.isFinite(lineCoverage) || lineCoverage < minLineCoverage) {
    console.error(`Line coverage ${lineCoverage}% is below the required ${minLineCoverage}%.`);
    process.exit(1);
}

console.log(`Coverage threshold passed: ${lineCoverage}% lines >= ${minLineCoverage}%.`);
