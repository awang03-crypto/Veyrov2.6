import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import styles from "../styles/AppPage.module.css";
import { useMeta } from "../hooks/useMeta.js";

export default function Analysis() {
    const { user, loading } = useAuth();
    const [games, setGames] = useState([]);
    const [status, setStatus] = useState("Loading analysis...");
    const [insights, setInsights] = useState(null);

    useMeta("Match Analysis | Veyro", "Analyse your match performance with position-specific stats, trend lines, and rating breakdowns saved in your Veyro vault.");

    useEffect(() => {
        if (loading || !user) { setStatus("Sign in to view your analysis."); return; }
        async function loadGames() {
            try {
                const q = query(collection(db, "users", user.uid, "ratings"), orderBy("timestamp", "desc"));
                const snap = await getDocs(q);
                const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setGames(list);
                if (list.length < 3) { setStatus("Save at least three games for analysis."); return; }
                const ratings = list.map((g) => g.finalRating || g.rating || 0);
                const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
                const best = list.reduce((a, b) => (b.finalRating || b.rating || 0) > (a.finalRating || a.rating || 0) ? b : a);
                const worst = list.reduce((a, b) => (b.finalRating || b.rating || 0) < (a.finalRating || a.rating || 0) ? b : a);
                const recent = list.slice(0, 5);
                const recentAvg = recent.map((g) => g.finalRating || g.rating || 0).reduce((a, b) => a + b, 0) / recent.length;
                setInsights({ avg: avg.toFixed(1), best, worst, recentAvg: recentAvg.toFixed(1), total: list.length });
                setStatus("");
            } catch (err) { console.error(err); setStatus("Could not load analysis data."); }
        }
        loadGames();
    }, [user, loading]);

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div>
                    <div className={styles.eyebrow}>Analysis</div>
                    <h1 className={styles.h1}>Performance Review</h1>
                    <p>{status || `${games.length} games analyzed`}</p>
                </div>
                <Link className={styles.navPill} to="/graph">View Graph</Link>
            </section>
            {insights && (
                <section className={styles.metricsGrid}>
                    <div className={styles.metricCard}><span>Average</span><strong>{insights.avg}</strong></div>
                    <div className={styles.metricCard}><span>Best Game</span><strong>{Math.round(insights.best.finalRating || insights.best.rating || 0)}</strong></div>
                    <div className={styles.metricCard}><span>Lowest</span><strong>{Math.round(insights.worst.finalRating || insights.worst.rating || 0)}</strong></div>
                    <div className={styles.metricCard}><span>Recent Form</span><strong>{insights.recentAvg}</strong></div>
                    <div className={styles.metricCard}><span>Total Games</span><strong>{insights.total}</strong></div>
                </section>
            )}
            {insights && (
                <section className={styles.panel} id="coachNotesGrid">
                    <h2>Coaching Notes</h2>
                    <p>Your average rating is <strong>{insights.avg}</strong>. Recent form is <strong>{insights.recentAvg}</strong>. Best game: <strong>{insights.best.opponent || "Unknown"}</strong> ({Math.round(insights.best.finalRating || insights.best.rating || 0)}). Focus on consistency and reducing your lowest performances.</p>
                </section>
            )}
            <section className={styles.panel}>
                <button type="button" className={styles.navPill} id="comparePlayersBtn">Compare with players your age</button>
            </section>
        </main>
    );
}
