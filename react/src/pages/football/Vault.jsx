import { isAdminUser } from "../../lib/adminConfig.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import styles from "../../styles/AppPage.module.css";
import { useMeta } from "../../hooks/useMeta.js";

const TABS = [["/football","Calculator"],["/football/vault","Vault"],["/football/graph","Graph"],["/football/analysis","Analysis"],["/football/compare","Compare"],["/football/profile","Profile"],["/football/team","Team"],["/football/coach","Coach"],["/football/recruiting","Recruiting"],["/football/video","Video AI"]];

export default function FootballVault() {
    const { user, loading } = useAuth();
    const [games, setGames] = useState([]);
    const isAdmin = isAdminUser(user);

    useMeta("Football Game Vault | Veyro", "Your saved football game ratings and stats history. Track performance trends across the season.");
    useEffect(() => {
        if (loading || !isAdmin) return;
        getDocs(collection(db, "footballGames")).then((snap) => setGames(snap.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(console.error);
    }, [user, loading, isAdmin]);

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div><div className={styles.eyebrow}>Football</div><h1 className={styles.h1}>Football Vault</h1><p>Review saved football ratings.</p>
                    <nav style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>{TABS.map(([to, label]) => <Link key={to} to={to} className={styles.navPill} style={{ fontSize: "0.62rem", padding: "7px 10px" }}>{label}</Link>)}</nav>
                </div>
            </section>
            {!isAdmin && !loading && <section className={styles.panel}><h2>Admin access required.</h2></section>}
            {isAdmin && (
                <section className={styles.panel}><h2>Saved Football Games</h2>
                    <div className={styles.matchList}>{games.map((g) => (<div key={g.id} className={styles.matchCard}><div className={styles.matchHeader}><strong>{g.opponent || "Game"}</strong><span className={styles.matchRating}>{g.rating || 0}</span></div><div className={styles.matchMeta}><span>{g.playerName}</span><span>{g.role}</span><span>{g.gameDate}</span></div></div>))}</div>
                </section>
            )}
        </main>
    );
}
