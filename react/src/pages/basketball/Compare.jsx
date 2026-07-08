import { isAdminUser } from "../../lib/adminConfig.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import styles from "../../styles/AppPage.module.css";
import { useMeta } from "../../hooks/useMeta.js";

const TABS = [["/basketball","Calculator"],["/basketball/vault","Vault"],["/basketball/graph","Graph"],["/basketball/analysis","Analysis"],["/basketball/compare","Compare"],["/basketball/profile","Profile"],["/basketball/team","Team"],["/basketball/coach","Coach"],["/basketball/recruiting","Recruiting"],["/basketball/video","Video AI"]];

export default function BasketballCompare() {
    const { user, loading } = useAuth();
    const [games, setGames] = useState([]);
    const isAdmin = isAdminUser(user);

    useMeta("Compare Basketball Games | Veyro", "Compare two basketball match performances side by side using per-minute stats and efficiency metrics.");
    useEffect(() => {
        if (loading || !isAdmin) return;
        getDocs(collection(db, "basketballGames")).then((snap) => setGames(snap.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(console.error);
    }, [user, loading, isAdmin]);

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div><div className={styles.eyebrow}>Basketball</div><h1 className={styles.h1}>Basketball Compare</h1><p>Compare two performances side by side.</p>
                    <nav style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>{TABS.map(([to, label]) => <Link key={to} to={to} className={styles.navPill} style={{ fontSize: "0.62rem", padding: "7px 10px" }}>{label}</Link>)}</nav>
                </div>
            </section>
            {!isAdmin && !loading && <section className={styles.panel}><h2>Admin access required.</h2></section>}
            {isAdmin && (<>
                <section className={styles.panel}><h2>Game Matchup</h2><div className={styles.grid}><select>{games.map((g)=><option key={g.id}>{g.opponent||"Game"} — {g.rating||0}</option>)}</select><select>{games.map((g)=><option key={g.id}>{g.opponent||"Game"} — {g.rating||0}</option>)}</select></div></section>
            </>)}
        </main>
    );
}
