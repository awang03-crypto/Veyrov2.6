import { isAdminUser } from "../../lib/adminConfig.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import styles from "../../styles/AppPage.module.css";
import { useMeta } from "../../hooks/useMeta.js";

const TABS = [["/football","Calculator"],["/football/vault","Vault"],["/football/graph","Graph"],["/football/analysis","Analysis"],["/football/compare","Compare"],["/football/profile","Profile"],["/football/team","Team"],["/football/coach","Coach"],["/football/recruiting","Recruiting"],["/football/video","Video AI"]];

export default function FootballProfile() {
    const { user, loading } = useAuth();
    const [games, setGames] = useState([]);
    const isAdmin = isAdminUser(user);

    useMeta("Football Player Profile | Veyro", "Your football player profile with average rating, best position, and full game history.");
    useEffect(() => {
        if (loading || !isAdmin) return;
        getDocs(collection(db, "footballGames")).then((snap) => setGames(snap.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(console.error);
    }, [user, loading, isAdmin]);

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div><div className={styles.eyebrow}>Football</div><h1 className={styles.h1}>Football Profile</h1><p>Build a player profile from saved ratings.</p>
                    <nav style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>{TABS.map(([to, label]) => <Link key={to} to={to} className={styles.navPill} style={{ fontSize: "0.62rem", padding: "7px 10px" }}>{label}</Link>)}</nav>
                </div>
            </section>
            {!isAdmin && !loading && <section className={styles.panel}><h2>Admin access required.</h2></section>}
            {isAdmin && (<>
                <section className={styles.panel}><h2>Player Profile</h2><p>Save games to build your profile.</p></section>
            </>)}
        </main>
    );
}
