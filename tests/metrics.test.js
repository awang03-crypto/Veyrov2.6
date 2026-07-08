import { describe, it } from "node:test";
import assert from "node:assert";
import { formatPrometheusMetrics } from "../lib/metrics.js";

describe("Operational metrics formatting", () => {
    it("formats stable Prometheus gauges", () => {
        const output = formatPrometheusMetrics({
            uptimeSeconds: 12.6,
            memory: { rss: 1234.4, heapUsed: 987.7 }
        });

        assert.match(output, /# TYPE veyro_uptime_seconds gauge/);
        assert.match(output, /veyro_uptime_seconds 13/);
        assert.match(output, /veyro_memory_rss_bytes 1234/);
        assert.match(output, /veyro_memory_heap_used_bytes 988/);
        assert.ok(output.endsWith("\n"));
    });

    it("clamps invalid negative values to zero", () => {
        const output = formatPrometheusMetrics({
            uptimeSeconds: -5,
            memory: { rss: -1, heapUsed: Number.NaN }
        });

        assert.match(output, /veyro_uptime_seconds 0/);
        assert.match(output, /veyro_memory_rss_bytes 0/);
        assert.match(output, /veyro_memory_heap_used_bytes 0/);
    });
});
