import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import styles from "../styles/AppPage.module.css";
import { useMeta } from "../hooks/useMeta.js";

export default function Compare() {
    const { user, loading } = useAuth();
    const [games, setGames] = useState([]);
    const [gameA, setGameA] = useState(null);
    const [gameB, setGameB] = useState(null);

    useMeta("Compare Matches | Veyro", "Compare two soccer match performances side by side. See which stats improved and where to focus next.");

    useEffect(() => {
        if (loading || !user) return;
        async function loadGames() {
            try {
                const q = query(collection(db, "users", user.uid, "ratings"), orderBy("timestamp", "desc"));
                const snap = await getDocs(q);
                setGames(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch (err) { console.error(err); }
        }
        loadGames();
    }, [user, loading]);

    function selectGame(setter, id) { setter(games.find((g) => g.id === id) || null); }

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div>
                    <div className={styles.eyebrow}>Comparison</div>
                    <h1 className={styles.h1}>Compare Games</h1>
                    <p>Select two saved matches to compare performance side by side.</p>
                </div>
                <Link className={styles.navPill} to="/vault">Back to Vault</Link>
            </section>
            <section className={styles.panel}>
                <h2>Game Matchup</h2>
                <div className={styles.grid}>
                    <select onChange={(e) => selectGame(setGameA, e.target.value)} defaultValue="">
                        <option value="" disabled>Select game A</option>
                        {games.map((g) => <option key={g.id} value={g.id}>{g.opponent || "Game"} — {Math.round(g.finalRating || g.rating || 0)}</option>)}
                    </select>
                    <select onChange={(e) => selectGame(setGameB, e.target.value)} defaultValue="">
                        <option value="" disabled>Select game B</option>
                        {games.map((g) => <option key={g.id} value={g.id}>{g.opponent || "Game"} — {Math.round(g.finalRating || g.rating || 0)}</option>)}
                    </select>
                </div>
            </section>
            {gameA && gameB && (
                <section className={styles.grid}>
                    <div className={styles.panel}>
                        <h2>{gameA.opponent || "Game A"}</h2>
                        <div className={styles.metricCard}><span>Rating</span><strong>{Math.round(gameA.finalRating || gameA.rating || 0)}</strong></div>
                        <p>{gameA.date} • {gameA.position?.toUpperCase()} • {gameA.minutes} min • {gameA.result}</p>
                    </div>
                    <div className={styles.panel}>
                        <h2>{gameB.opponent || "Game B"}</h2>
                        <div className={styles.metricCard}><span>Rating</span><strong>{Math.round(gameB.finalRating || gameB.rating || 0)}</strong></div>
                        <p>{gameB.date} • {gameB.position?.toUpperCase()} • {gameB.minutes} min • {gameB.result}</p>
                    </div>
                </section>
            )}
        </main>
    );
}
