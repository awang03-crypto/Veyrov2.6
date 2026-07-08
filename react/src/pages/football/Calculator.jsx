import { isAdminUser } from "../../lib/adminConfig.js";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { calculateFootballRating } from "../../services/ratings";
import styles from "../../styles/AppPage.module.css";
import { useMeta } from "../../hooks/useMeta.js";

const TABS = [
    ["/football","Calculator"],["/football/vault","Vault"],["/football/graph","Graph"],
    ["/football/analysis","Analysis"],["/football/compare","Compare"],["/football/profile","Profile"],
    ["/football/team","Team"],["/football/coach","Coach"],["/football/recruiting","Recruiting"],
    ["/football/video","Video AI"],
];

export default function FootballCalculator() {
    const { user, loading } = useAuth();
    const [games, setGames] = useState([]);
    const [rating, setRating] = useState(50);
    const isAdmin = isAdminUser(user);

    useMeta("Football Player Rating Calculator | Veyro", "Free football player match rating calculator for QB, RB, WR, TE, OL, DL, LB, DB, and K positions.");

    const recalc = useCallback(() => {
        const vals = {};
        ["minutes","points","assists","rebounds","steals","blocks","turnovers","fgm","fga","tpm","tpa","ftm","fta","plusMinus"].forEach((id) => {
            const el = document.getElementById(`fb_${id}`);
            vals[id] = Number(el?.value || 0);
        });
        setRating(calculateFootballRating(vals));
    }, []);

    useEffect(() => {
        if (loading || !isAdmin) return;
        getDocs(collection(db, "footballGames")).then((snap) => setGames(snap.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(console.error);
    }, [user, loading, isAdmin]);

    async function handleSave() {
        const vals = {};
        ["playerName","opponent","gameDate","role","minutes","points","assists","rebounds","steals","blocks","turnovers","fgm","fga","tpm","tpa","ftm","fta","plusMinus","result"].forEach((id) => {
            const el = document.getElementById(`fb_${id}`);
            vals[id] = el?.type === "number" ? Number(el.value || 0) : (el?.value || "");
        });
        vals.rating = calculateFootballRating(vals);
        vals.timestamp = serverTimestamp();
        try {
            const ref = await addDoc(collection(db, "footballGames"), vals);
            setGames((prev) => [{ id: ref.id, ...vals }, ...prev]);
        } catch (err) { console.error(err); }
    }

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div>
                    <div className={styles.eyebrow}>Admin Football Lab</div>
                    <h1 className={styles.h1}>Veyro Football</h1>
                    <p>A private prototype for football ratings.</p>
                    <nav style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                        {TABS.map(([to, label]) => <Link key={to} to={to} className={styles.navPill} style={{ fontSize: "0.62rem", padding: "7px 10px" }}>{label}</Link>)}
                    </nav>
                </div>
            </section>
            {!isAdmin && !loading && <section className={styles.panel}><h2>Admin access required.</h2></section>}
            {isAdmin && (
                <>
                    <section className={styles.panel}>
                        <h2>Football Calculator</h2>
                        <div style={{ textAlign: "center", fontSize: "2.4rem", fontFamily: "var(--display)", color: "var(--green-1)", margin: "10px 0" }}>{rating}<span style={{ fontSize: "1rem", color: "var(--muted)" }}>/100</span></div>
                        <div className={styles.formGrid}>
                            <label>Player<input id="fb_playerName" defaultValue="Admin Player" /></label>
                            <div className={styles.twoCol}><label>Opponent<input id="fb_opponent" placeholder="Opponent" /></label><label>Date<input id="fb_gameDate" type="date" /></label></div>
                            <div className={styles.twoCol}><label>Role<select id="fb_role"><option value="qb">QB</option><option value="rb">RB</option><option value="wr">WR</option><option value="dl">DL</option><option value="lb">LB</option><option value="db">DB</option></select></label><label>Minutes<input id="fb_minutes" type="number" min="1" max="60" defaultValue="28" onChange={recalc} /></label></div>
                            <div className={styles.twoCol}><label>Points<input id="fb_points" type="number" min="0" defaultValue="12" onChange={recalc} /></label><label>Assists<input id="fb_assists" type="number" min="0" defaultValue="4" onChange={recalc} /></label></div>
                            <div className={styles.twoCol}><label>Rebounds<input id="fb_rebounds" type="number" min="0" defaultValue="5" onChange={recalc} /></label><label>Steals<input id="fb_steals" type="number" min="0" defaultValue="1" onChange={recalc} /></label></div>
                            <div className={styles.twoCol}><label>Blocks<input id="fb_blocks" type="number" min="0" defaultValue="0" onChange={recalc} /></label><label>Turnovers<input id="fb_turnovers" type="number" min="0" defaultValue="2" onChange={recalc} /></label></div>
                            <div className={styles.twoCol}><label>FG Made<input id="fb_fgm" type="number" min="0" defaultValue="5" onChange={recalc} /></label><label>FG Att<input id="fb_fga" type="number" min="0" defaultValue="11" onChange={recalc} /></label></div>
                            <div className={styles.twoCol}><label>3PT Made<input id="fb_tpm" type="number" min="0" defaultValue="1" onChange={recalc} /></label><label>3PT Att<input id="fb_tpa" type="number" min="0" defaultValue="4" onChange={recalc} /></label></div>
                            <div className={styles.twoCol}><label>FT Made<input id="fb_ftm" type="number" min="0" defaultValue="1" onChange={recalc} /></label><label>FT Att<input id="fb_fta" type="number" min="0" defaultValue="2" onChange={recalc} /></label></div>
                            <div className={styles.twoCol}><label>Plus/Minus<input id="fb_plusMinus" type="number" defaultValue="3" onChange={recalc} /></label><label>Result<select id="fb_result"><option value="win">Win</option><option value="loss">Loss</option></select></label></div>
                        </div>
                        <div className={styles.btnRow}><button className={styles.navPill} onClick={handleSave}>Save Football Game</button></div>
                    </section>
                    {games.length > 0 && (
                        <section className={styles.panel}><h2>Saved Games ({games.length})</h2>
                            <div className={styles.matchList}>{games.slice(0, 20).map((g) => (<div key={g.id} className={styles.matchCard}><div className={styles.matchHeader}><strong>{g.opponent || "Game"}</strong><span className={styles.matchRating}>{g.rating || 0}</span></div><div className={styles.matchMeta}><span>{g.playerName}</span><span>{g.role}</span><span>{g.minutes} min</span></div></div>))}</div>
                        </section>
                    )}
                </>
            )}
        </main>
    );
}
