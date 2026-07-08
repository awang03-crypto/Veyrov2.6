import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    root: "react",
    base: "/",
    plugins: [react()],
    build: {
        outDir: "./dist",
        emptyOutDir: true,
        cssCodeSplit: true,
        rolldownOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes("node_modules")) return undefined;
                    if (id.includes("chart.js") || id.includes("chartjs")) return "vendor-chart";
                    if (id.includes("firebase/firestore")) return "vendor-firestore";
                    if (id.includes("firebase/auth")) return "vendor-firebase-auth";
                    if (id.includes("firebase")) return "vendor-firebase";
                    if (id.includes("react-router-dom") || id.includes("react-router")) return "vendor-router";
                    if (id.includes("react-dom")) return "vendor-react-dom";
                    if (id.includes("react")) return "vendor-react";
                    return "vendor";
                }
            }
        }
    },
    server: {
        port: 5173,
        host: true
    }
});
