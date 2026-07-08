import { isAdminUser } from "../../lib/adminConfig.js";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { calculateBasketballRating } from "../../services/ratings";
import styles from "../../styles/AppPage.module.css";
import { useMeta } from "../../hooks/useMeta.js";

const TABS = [
    ["/basketball", "Calculator"], ["/basketball/vault", "Vault"], ["/basketball/graph", "Graph"],
    ["/basketball/analysis", "Analysis"], ["/basketball/compare", "Compare"], ["/basketball/profile", "Profile"],
    ["/basketball/team", "Team"], ["/basketball/coach", "Coach"], ["/basketball/recruiting", "Recruiting"],
    ["/basketball/video", "Video AI"],
];

export default function BasketballCalculator() {
    const { user, loading } = useAuth();
    const [games, setGames] = useState([]);
    const [rating, setRating] = useState(50);
    const [status, setStatus] = useState("Checking your admin session...");
    const isAdmin = isAdminUser(user);

    useMeta("Basketball Player Rating Calculator | Veyro", "Free basketball player match rating calculator. Rate performance using points, assists, rebounds, steals, and efficiency stats.");

    const recalc = useCallback(() => {
        const vals = {};
        ["minutes","points","assists","rebounds","steals","blocks","turnovers","fgm","fga","tpm","tpa","ftm","fta","plusMinus"].forEach((id) => {
            const el = document.getElementById(id);
            vals[id] = Number(el?.value || 0);
        });
        setRating(calculateBasketballRating(vals));
    }, []);

    useEffect(() => {
        if (loading) return;
        if (!isAdmin) { setStatus("Admin access required."); return; }
        setStatus("");
        async function loadGames() {
            try {
                const snap = await getDocs(collection(db, "basketballGames"));
                setGames(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch (err) { console.warn(err); }
        }
        loadGames();
    }, [user, loading, isAdmin]);

    async function handleSave() {
        const vals = {};
        ["playerName","opponent","gameDate","role","minutes","points","assists","rebounds","steals","blocks","turnovers","fgm","fga","tpm","tpa","ftm","fta","plusMinus","result"].forEach((id) => {
            const el = document.getElementById(id);
            vals[id] = el?.type === "number" ? Number(el.value || 0) : (el?.value || "");
        });
        vals.rating = calculateBasketballRating(vals);
        vals.timestamp = serverTimestamp();
        try {
            const ref = await addDoc(collection(db, "basketballGames"), vals);
            setGames((prev) => [{ id: ref.id, ...vals }, ...prev]);
        } catch (err) { console.error(err); }
    }

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div>
                    <div className={styles.eyebrow}>Admin Basketball Lab</div>
                    <h1 className={styles.h1}>Veyro Basketball</h1>
                    <p>A private prototype for basketball ratings.</p>
                    <nav style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                        {TABS.map(([to, label]) => <Link key={to} to={to} className={styles.navPill} style={{ fontSize: "0.62rem", padding: "7px 10px" }}>{label}</Link>)}
                    </nav>
                </div>
            </section>
            {!isAdmin && !loading && <section className={styles.panel}><h2>Admin access required.</h2><p>Sign in as the configured admin account.</p></section>}
            {isAdmin && (
                <>
                    <section className={styles.panel}>
                        <h2>Basketball Calculator</h2>
                        <div style={{ textAlign: "center", fontSize: "2.4rem", fontFamily: "var(--display)", color: "var(--green-1)", margin: "10px 0" }}>{rating}<span style={{ fontSize: "1rem", color: "var(--muted)" }}>/100</span></div>
                        <div className={styles.formGrid}>
                            <label>Player<input id="playerName" defaultValue="Admin Player" /></label>
                            <div className={styles.twoCol}>
                                <label>Opponent<input id="opponent" placeholder="Opponent" /></label>
                                <label>Date<input id="gameDate" type="date" /></label>
                            </div>
                            <div className={styles.twoCol}>
                                <label>Role<select id="role"><option value="guard">Guard</option><option value="wing">Wing</option><option value="big">Big</option></select></label>
                                <label>Minutes<input id="minutes" type="number" min="1" max="60" defaultValue="28" onChange={recalc} /></label>
                            </div>
                            <div className={styles.twoCol}>
                                <label>Points<input id="points" type="number" min="0" defaultValue="12" onChange={recalc} /></label>
                                <label>Assists<input id="assists" type="number" min="0" defaultValue="4" onChange={recalc} /></label>
                            </div>
                            <div className={styles.twoCol}>
                                <label>Rebounds<input id="rebounds" type="number" min="0" defaultValue="5" onChange={recalc} /></label>
                                <label>Steals<input id="steals" type="number" min="0" defaultValue="1" onChange={recalc} /></label>
                            </div>
                            <div className={styles.twoCol}>
                                <label>Blocks<input id="blocks" type="number" min="0" defaultValue="0" onChange={recalc} /></label>
                                <label>Turnovers<input id="turnovers" type="number" min="0" defaultValue="2" onChange={recalc} /></label>
                            </div>
                            <div className={styles.twoCol}>
                                <label>FG Made<input id="fgm" type="number" min="0" defaultValue="5" onChange={recalc} /></label>
                                <label>FG Attempts<input id="fga" type="number" min="0" defaultValue="11" onChange={recalc} /></label>
                            </div>
                            <div className={styles.twoCol}>
                                <label>3PT Made<input id="tpm" type="number" min="0" defaultValue="1" onChange={recalc} /></label>
                                <label>3PT Attempts<input id="tpa" type="number" min="0" defaultValue="4" onChange={recalc} /></label>
                            </div>
                            <div className={styles.twoCol}>
                                <label>FT Made<input id="ftm" type="number" min="0" defaultValue="1" onChange={recalc} /></label>
                                <label>FT Attempts<input id="fta" type="number" min="0" defaultValue="2" onChange={recalc} /></label>
                            </div>
                            <div className={styles.twoCol}>
                                <label>Plus / Minus<input id="plusMinus" type="number" defaultValue="3" onChange={recalc} /></label>
                                <label>Result<select id="result"><option value="win">Win</option><option value="loss">Loss</option></select></label>
                            </div>
                        </div>
                        <div className={styles.btnRow}>
                            <button className={styles.navPill} onClick={handleSave}>Save Basketball Game</button>
                        </div>
                    </section>
                    {games.length > 0 && (
                        <section className={styles.panel}>
                            <h2>Saved Games ({games.length})</h2>
                            <div className={styles.matchList}>
                                {games.slice(0, 20).map((g) => (
                                    <div key={g.id} className={styles.matchCard}>
                                        <div className={styles.matchHeader}><strong>{g.opponent || "Game"}</strong><span className={styles.matchRating}>{g.rating || 0}</span></div>
                                        <div className={styles.matchMeta}><span>{g.playerName}</span><span>{g.role}</span><span>{g.minutes} min</span><span>{g.points} pts</span></div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </main>
    );
}
