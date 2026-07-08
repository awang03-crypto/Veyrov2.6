import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./tests/react/setup.js"],
        include: ["tests/react/**/*.test.jsx", "tests/react/**/*.test.js"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["react/src/**/*.{js,jsx}"],
            exclude: ["react/src/main.jsx"],
            thresholds: {
                lines: 70,
                functions: 70,
                branches: 60,
                statements: 70
            }
        }
    }
});
