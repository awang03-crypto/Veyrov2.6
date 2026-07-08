import { isAdminUser } from "../../lib/adminConfig.js";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import styles from "../../styles/AppPage.module.css";
import { useMeta } from "../../hooks/useMeta.js";

const TABS = [["/football","Calculator"],["/football/vault","Vault"],["/football/graph","Graph"],["/football/analysis","Analysis"],["/football/compare","Compare"],["/football/profile","Profile"],["/football/team","Team"],["/football/coach","Coach"],["/football/recruiting","Recruiting"],["/football/video","Video AI"]];

export default function FootballGraph() {
    const { user, loading } = useAuth();
    const [games, setGames] = useState([]);
    const chartRef = useRef(null);
    const isAdmin = isAdminUser(user);

    useMeta("Football Performance Graph | Veyro", "Visualise your football player rating trend over time. Track development across a full season.");
    useEffect(() => {
        if (loading || !isAdmin) return;
        getDocs(collection(db, "footballGames")).then((snap) => setGames(snap.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(console.error);
    }, [user, loading, isAdmin]);
    useEffect(() => {
        if (games.length < 2 || !chartRef.current) return;
        let chart = null;
        async function render() {
            const { Chart, registerables } = await import("chart.js");
            Chart.register(...registerables);
            chart = new Chart(chartRef.current, {
                type: "line",
                data: { labels: games.map((g) => g.opponent || "Game"), datasets: [{ label: "Rating", data: games.map((g) => g.rating || 0), borderColor: "#183f2f", fill: true, tension: 0.35 }] },
                options: { responsive: true, scales: { y: { min: 0, max: 100 } } },
            });
        }
        render();
        return () => { if (chart) chart.destroy(); };
    }, [games]);

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div><div className={styles.eyebrow}>Football</div><h1 className={styles.h1}>Football Graphs</h1><p>Track rating trend and performance signals.</p>
                    <nav style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>{TABS.map(([to, label]) => <Link key={to} to={to} className={styles.navPill} style={{ fontSize: "0.62rem", padding: "7px 10px" }}>{label}</Link>)}</nav>
                </div>
            </section>
            {!isAdmin && !loading && <section className={styles.panel}><h2>Admin access required.</h2></section>}
            {isAdmin && (<>
                <section className={styles.panel}><h2>Rating Trend</h2><canvas ref={chartRef} /></section>
            </>)}
        </main>
    );
}
