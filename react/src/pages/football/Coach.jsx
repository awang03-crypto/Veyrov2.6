import { isAdminUser } from "../../lib/adminConfig.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import styles from "../../styles/AppPage.module.css";
import { canUseFeature, planGateMessage, PLAN_FEATURES } from "../../services/monetization";
import { useMeta } from "../../hooks/useMeta.js";

const TABS = [["/football","Calculator"],["/football/vault","Vault"],["/football/graph","Graph"],["/football/analysis","Analysis"],["/football/compare","Compare"],["/football/profile","Profile"],["/football/team","Team"],["/football/coach","Coach"],["/football/recruiting","Recruiting"],["/football/video","Video AI"]];

export default function FootballCoach() {
    const { user, loading } = useAuth();
    const [games, setGames] = useState([]);
    const isAdmin = isAdminUser(user);

    useMeta("Football Coach Dashboard | Veyro", "Manage your football team, review player ratings by position, and track roster development.");
    useEffect(() => {
        if (loading || !isAdmin) return;
        getDocs(collection(db, "footballGames")).then((snap) => setGames(snap.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(console.error);
    }, [user, loading, isAdmin]);

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div><div className={styles.eyebrow}>Football</div><h1 className={styles.h1}>Football Coach</h1><p>Coach dashboard for team management.</p>
                    <nav style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>{TABS.map(([to, label]) => <Link key={to} to={to} className={styles.navPill} style={{ fontSize: "0.62rem", padding: "7px 10px" }}>{label}</Link>)}</nav>
                </div>
            </section>
            {!isAdmin && !loading && <section className={styles.panel}><h2>Admin access required.</h2></section>}
            {isAdmin && (<>
                <section className={styles.panel}><h2>Coach Dashboard</h2><p>Coach features for this sport are under development.</p></section>
            </>)}
        </main>
    );
}
