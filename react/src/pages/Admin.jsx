import { isAdminUser } from "../lib/adminConfig.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import styles from "../styles/AppPage.module.css";


export default function Admin() {
    const { user, profile, loading } = useAuth();
    const [status, setStatus] = useState("Checking your admin session...");
    const [metrics, setMetrics] = useState({ users: 0, guests: 0, ratings: 0, avg: "0.0", feedback: 0 });
    const [users, setUsers] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [events, setEvents] = useState([]);
    const [feedbackMsgs, setFeedbackMsgs] = useState([]);

    useEffect(() => { document.title = "Admin Dashboard | Veyro"; }, []);

    useEffect(() => {
        if (loading) return;
        if (!user || user.email !== ADMIN_EMAIL) { setStatus("Admin access required. Sign in as the admin account."); return; }
        async function loadAdmin() {
            try {
                const usersSnap = await getDocs(collection(db, "users"));
                const usersList = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setUsers(usersList);

                let allRatings = [];
                for (const u of usersList.slice(0, 50)) {
                    const rSnap = await getDocs(query(collection(db, "users", u.id, "ratings"), orderBy("timestamp", "desc"), limit(10)));
                    rSnap.docs.forEach((d) => allRatings.push({ id: d.id, userId: u.id, playerName: u.playerName, ...d.data() }));
                }
                allRatings.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                setRatings(allRatings.slice(0, 50));

                const avg = allRatings.length ? (allRatings.reduce((s, r) => s + (r.finalRating || r.rating || 0), 0) / allRatings.length).toFixed(1) : "0.0";

                let guestCount = 0;
                try { const evtSnap = await getDocs(collection(db, "siteEvents")); setEvents(evtSnap.docs.map((d) => d.data()).slice(0, 30)); guestCount = evtSnap.docs.filter((d) => d.data().event === "guestContinue").length; } catch (e) { /* no siteEvents collection */ }

                let fbCount = 0;
                try { const fbSnap = await getDocs(collection(db, "feedbackMessages")); setFeedbackMsgs(fbSnap.docs.map((d) => d.data()).slice(0, 20)); fbCount = fbSnap.size; } catch (e) { /* ok */ }

                setMetrics({ users: usersList.length, guests: guestCount, ratings: allRatings.length, avg, feedback: fbCount });
                setStatus("");
            } catch (err) { console.error(err); setStatus("Could not load admin data."); }
        }
        loadAdmin();
    }, [user, loading]);

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div>
                    <div className={styles.eyebrow}>Private Admin</div>
                    <h1 className={styles.h1}>Veyro Command Center</h1>
                    <p>{status || "Admin dashboard loaded"}</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link className={styles.navPill} to="/basketball">Open Basketball</Link>
                    <Link className={styles.navPill} to="/football">Open Football</Link>
                    <Link className={`${styles.navPill} ${styles.secondary}`} to="/">Back to Site</Link>
                </div>
            </section>
            <section className={styles.metricsGrid}>
                <div className={styles.metricCard}><span>Users</span><strong>{metrics.users}</strong></div>
                <div className={styles.metricCard}><span>Guest Visits</span><strong>{metrics.guests}</strong></div>
                <div className={styles.metricCard}><span>Saved Games</span><strong>{metrics.ratings}</strong></div>
                <div className={styles.metricCard}><span>Avg Rating</span><strong>{metrics.avg}</strong></div>
                <div className={styles.metricCard}><span>Feedback</span><strong>{metrics.feedback}</strong></div>
            </section>
            <div className={styles.dashboardGrid}>
                <div>
                    <section className={styles.panel}>
                        <h2>Players</h2>
                        <div className={styles.tableWrap}>
                            {users.slice(0, 20).map((u) => (<div key={u.id} className={styles.matchCard}><strong>{u.playerName || u.id}</strong> — {u.email || "no email"} — {(u.position || "").toUpperCase()}</div>))}
                        </div>
                    </section>
                    <section className={styles.panel}>
                        <h2>Recent Saved Games</h2>
                        <div className={styles.tableWrap}>
                            {ratings.slice(0, 15).map((r) => (<div key={r.id} className={styles.matchCard}><strong>{r.playerName || r.userId}</strong> vs {r.opponent || "?"} — {Math.round(r.finalRating || r.rating || 0)}</div>))}
                        </div>
                    </section>
                </div>
                <div>
                    <section className={styles.panel}>
                        <h2>Recent Site Events</h2>
                        <div className={styles.feed}>{events.length ? events.map((e, i) => <div key={i} className={styles.matchCard}>{e.event} — {e.email || "anon"}</div>) : <div className={styles.empty}>No events loaded.</div>}</div>
                    </section>
                    <section className={styles.panel}>
                        <h2>Feedback Messages</h2>
                        <div className={styles.feed}>{feedbackMsgs.length ? feedbackMsgs.map((f, i) => <div key={i} className={styles.matchCard}><strong>{f.name || "Anonymous"}</strong>: {f.message}</div>) : <div className={styles.empty}>No feedback yet.</div>}</div>
                    </section>
                </div>
            </div>
        </main>
    );
}
