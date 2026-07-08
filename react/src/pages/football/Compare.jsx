import { isAdminUser } from "../../lib/adminConfig.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import styles from "../../styles/AppPage.module.css";
import { useMeta } from "../../hooks/useMeta.js";

const TABS = [["/football","Calculator"],["/football/vault","Vault"],["/football/graph","Graph"],["/football/analysis","Analysis"],["/football/compare","Compare"],["/football/profile","Profile"],["/football/team","Team"],["/football/coach","Coach"],["/football/recruiting","Recruiting"],["/football/video","Video AI"]];

export default function FootballCompare() {
    const { user, loading } = useAuth();
    const [games, setGames] = useState([]);
    const isAdmin = isAdminUser(user);

    useMeta("Compare Football Games | Veyro", "Compare two football match performances side by side using position-specific stat formulas.");
    useEffect(() => {
        if (loading || !isAdmin) return;
        getDocs(collection(db, "footballGames")).then((snap) => setGames(snap.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(console.error);
    }, [user, loading, isAdmin]);

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div><div className={styles.eyebrow}>Football</div><h1 className={styles.h1}>Football Compare</h1><p>Compare two performances side by side.</p>
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
