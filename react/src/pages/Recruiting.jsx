import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import styles from "../styles/AppPage.module.css";
import { useMeta } from "../hooks/useMeta.js";

export default function Recruiting() {
    const { user, profile, loading } = useAuth();
    const [status, setStatus] = useState("Loading recruiting profile...");
    const [games, setGames] = useState([]);

    useMeta("Soccer Player Recruiting Profile | Veyro", "Build a recruiting profile with your match ratings, stats history, and performance trends to share with coaches and scouts.");

    useEffect(() => {
        if (loading || !user) { setStatus("Sign in to build your recruiting profile."); return; }
        async function loadGames() {
            try {
                const q = query(collection(db, "users", user.uid, "ratings"), orderBy("timestamp", "desc"));
                const snap = await getDocs(q);
                const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setGames(list);
                setStatus(list.length >= 5 ? "" : "Save at least 5 games to build a recruiting profile.");
            } catch (err) { console.error(err); setStatus("Could not load data."); }
        }
        loadGames();
    }, [user, loading]);

    const ratings = games.map((g) => g.finalRating || g.rating || 0);
    const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "--";
    const best = ratings.length ? Math.max(...ratings) : "--";

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div>
                    <div className={styles.eyebrow}>Recruiting</div>
                    <h1 className={styles.h1}>Recruiting Profile</h1>
                    <p>{status || `${games.length} games in profile`}</p>
                </div>
                <Link className={styles.navPill} to="/vault">Back to Vault</Link>
            </section>
            {user && profile && (
                <section className={styles.metricsGrid}>
                    <div className={styles.metricCard}><span>Player</span><strong>{profile.playerName || "—"}</strong></div>
                    <div className={styles.metricCard}><span>Position</span><strong>{(profile.position || "—").toUpperCase()}</strong></div>
                    <div className={styles.metricCard}><span>Age</span><strong>{profile.age || "—"}</strong></div>
                    <div className={styles.metricCard}><span>Average</span><strong>{avg}</strong></div>
                    <div className={styles.metricCard}><span>Best</span><strong>{best}</strong></div>
                    <div className={styles.metricCard}><span>Games</span><strong>{games.length}</strong></div>
                </section>
            )}
            {games.length > 0 && (
                <section className={styles.panel}>
                    <h2>Match History</h2>
                    <div className={styles.matchList}>
                        {games.slice(0, 20).map((g) => (
                            <div key={g.id} className={styles.matchCard}>
                                <div className={styles.matchHeader}><strong>{g.opponent || "Unknown"}</strong><span className={styles.matchRating}>{Math.round(g.finalRating || g.rating || 0)}</span></div>
                                <div className={styles.matchMeta}><span>{g.date || ""}</span><span>{(g.position || "").toUpperCase()}</span><span>{g.minutes ? `${g.minutes} min` : ""}</span></div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
