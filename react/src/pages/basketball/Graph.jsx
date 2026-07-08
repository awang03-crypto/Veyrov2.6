import { isAdminUser } from "../../lib/adminConfig.js";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import styles from "../../styles/AppPage.module.css";
import { useMeta } from "../../hooks/useMeta.js";

const TABS = [["/basketball","Calculator"],["/basketball/vault","Vault"],["/basketball/graph","Graph"],["/basketball/analysis","Analysis"],["/basketball/compare","Compare"],["/basketball/profile","Profile"],["/basketball/team","Team"],["/basketball/coach","Coach"],["/basketball/recruiting","Recruiting"],["/basketball/video","Video AI"]];

export default function BasketballGraph() {
    const { user, loading } = useAuth();
    const [games, setGames] = useState([]);
    const chartRef = useRef(null);
    const isAdmin = isAdminUser(user);

    useMeta("Basketball Performance Graph | Veyro", "Visualise your basketball player rating trend over time. Track development across a full season.");
    useEffect(() => {
        if (loading || !isAdmin) return;
        getDocs(collection(db, "basketballGames")).then((snap) => setGames(snap.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(console.error);
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
                <div><div className={styles.eyebrow}>Basketball</div><h1 className={styles.h1}>Basketball Graphs</h1><p>Track rating trend and performance signals.</p>
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
