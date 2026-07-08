export function formatPrometheusMetrics({ uptimeSeconds, memory }) {
    const uptime = Math.max(0, Math.round(Number(uptimeSeconds || 0)));
    const rss = Math.max(0, Math.round(Number(memory?.rss || 0)));
    const heapUsed = Math.max(0, Math.round(Number(memory?.heapUsed || 0)));

    return [
        "# HELP veyro_uptime_seconds Process uptime in seconds.",
        "# TYPE veyro_uptime_seconds gauge",
        `veyro_uptime_seconds ${uptime}`,
        "# HELP veyro_memory_rss_bytes Resident set memory size in bytes.",
        "# TYPE veyro_memory_rss_bytes gauge",
        `veyro_memory_rss_bytes ${rss}`,
        "# HELP veyro_memory_heap_used_bytes Used V8 heap in bytes.",
        "# TYPE veyro_memory_heap_used_bytes gauge",
        `veyro_memory_heap_used_bytes ${heapUsed}`
    ].join("\n") + "\n";
}
