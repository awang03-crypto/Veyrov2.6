import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import styles from "../styles/AppPage.module.css";
import { useMeta } from "../hooks/useMeta.js";

export default function Graph() {
    const { user, loading } = useAuth();
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [games, setGames] = useState([]);
    const [status, setStatus] = useState("Loading graph data...");

    useMeta("Performance Graph | Veyro", "Visualise your soccer player rating trend over time. Spot improvement patterns and track development across matches.");

    useEffect(() => {
        if (loading || !user) { setStatus("Sign in to view your performance graph."); return; }
        async function loadGames() {
            try {
                const q = query(collection(db, "users", user.uid, "ratings"), orderBy("timestamp", "asc"));
                const snap = await getDocs(q);
                const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setGames(list);
                setStatus(list.length >= 2 ? "" : "Save at least two games to see a graph.");
            } catch (err) { console.error(err); setStatus("Could not load graph data."); }
        }
        loadGames();
    }, [user, loading]);

    useEffect(() => {
        if (games.length < 2 || !chartRef.current) return;
        let chart = null;
        async function renderChart() {
            const { Chart, registerables } = await import("chart.js");
            Chart.register(...registerables);
            if (chartInstance.current) chartInstance.current.destroy();
            const labels = games.map((g) => g.date || g.opponent || "Game");
            const data = games.map((g) => Math.round(g.finalRating || g.rating || 0));
            chart = new Chart(chartRef.current, {
                type: "line",
                data: { labels, datasets: [{ label: "Rating", data, borderColor: "#183f2f", backgroundColor: "rgba(24,63,47,0.1)", fill: true, tension: 0.35 }] },
                options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } },
            });
            chartInstance.current = chart;
        }
        renderChart();
        return () => { if (chart) chart.destroy(); };
    }, [games]);

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div>
                    <div className={styles.eyebrow}>Performance</div>
                    <h1 className={styles.h1}>Rating Graph</h1>
                    <p>{status || `${games.length} games plotted`}</p>
                </div>
                <Link className={styles.navPill} to="/vault">Back to Vault</Link>
            </section>
            <section className={styles.panel} id="chartWrap">
                <h2>Rating Trend</h2>
                <canvas ref={chartRef} />
            </section>
        </main>
    );
}
