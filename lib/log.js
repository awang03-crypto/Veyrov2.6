/**
 * Structured JSON logging for Veyro.
 * Use instead of console.log/warn/error for searchable, filterable logs.
 */

const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

const currentLevel = process.env.LOG_LEVEL || "info";

function log(level, message, data = {}) {
    if (levels[level] < levels[currentLevel]) return;
    const entry = {
        time: new Date().toISOString(),
        level,
        message,
        ...data
    };
    if (level === "error") {
        console.error(JSON.stringify(entry));
    } else {
        console.log(JSON.stringify(entry));
    }
}

export function debug(message, data) { log("debug", message, data); }
export function info(message, data) { log("info", message, data); }
export function warn(message, data) { log("warn", message, data); }
export function error(message, data) { log("error", message, data); }

export default { debug, info, warn, error };