import { isAdminUser } from "../../lib/adminConfig.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import styles from "../../styles/AppPage.module.css";
import { useMeta } from "../../hooks/useMeta.js";

const TABS = [["/basketball","Calculator"],["/basketball/vault","Vault"],["/basketball/graph","Graph"],["/basketball/analysis","Analysis"],["/basketball/compare","Compare"],["/basketball/profile","Profile"],["/basketball/team","Team"],["/basketball/coach","Coach"],["/basketball/recruiting","Recruiting"],["/basketball/video","Video AI"]];

export default function BasketballVault() {
    const { user, loading } = useAuth();
    const [games, setGames] = useState([]);
    const isAdmin = isAdminUser(user);

    useMeta("Basketball Match Vault | Veyro", "Your saved basketball match ratings and stats history. Track performance trends across the season.");
    useEffect(() => {
        if (loading || !isAdmin) return;
        getDocs(collection(db, "basketballGames")).then((snap) => setGames(snap.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(console.error);
    }, [user, loading, isAdmin]);

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div><div className={styles.eyebrow}>Basketball</div><h1 className={styles.h1}>Basketball Vault</h1><p>Review, filter, and export every saved basketball rating.</p>
                    <nav style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>{TABS.map(([to, label]) => <Link key={to} to={to} className={styles.navPill} style={{ fontSize: "0.62rem", padding: "7px 10px" }}>{label}</Link>)}</nav>
                </div>
            </section>
            {!isAdmin && !loading && <section className={styles.panel}><h2>Admin access required.</h2></section>}
            {isAdmin && (
                <section className={styles.panel}><h2>Saved Basketball Games</h2>
                    <div className={styles.matchList}>{games.map((g) => (<div key={g.id} className={styles.matchCard}><div className={styles.matchHeader}><strong>{g.opponent || "Game"}</strong><span className={styles.matchRating}>{g.rating || 0}</span></div><div className={styles.matchMeta}><span>{g.playerName}</span><span>{g.role}</span><span>{g.gameDate}</span></div></div>))}</div>
                </section>
            )}
        </main>
    );
}
