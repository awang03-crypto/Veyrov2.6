import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import styles from "../styles/AppPage.module.css";
import { canUseFeature, planGateMessage, PLAN_FEATURES } from "../services/monetization";
import { useMeta } from "../hooks/useMeta.js";

export default function Coach() {
    const { user, profile, loading } = useAuth();
    const [status, setStatus] = useState("Loading coach dashboard...");
    const [teamData, setTeamData] = useState(null);
    const [players, setPlayers] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [teamCode, setTeamCode] = useState("");

    useMeta("Coach Dashboard | Veyro", "Manage your team, review player ratings, approve join requests, and track roster development trends.");

    useEffect(() => {
        if (loading || !user || !profile) return;
        if (profile.role !== "coach" && profile.role !== "admin") { setStatus("Coach access required."); return; }
        async function loadTeam() {
            try {
                const teamQ = query(collection(db, "teams"), where("coachUid", "==", user.uid));
                const teamSnap = await getDocs(teamQ);
                if (teamSnap.empty) { setStatus("No team found. Create a team below."); return; }
                const teamDoc = teamSnap.docs[0];
                const team = { id: teamDoc.id, ...teamDoc.data() };
                setTeamData(team);
                setTeamCode(teamDoc.id);
                const memberQ = query(collection(db, "users"), where("teamId", "==", teamDoc.id));
                const memberSnap = await getDocs(memberQ);
                setPlayers(memberSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
                setStatus("");
            } catch (err) { console.error(err); setStatus("Could not load coach data."); }
        }
        loadTeam();
    }, [user, profile, loading]);

    async function handleCreateTeam(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const name = fd.get("teamName");
        if (!name || !user) return;
        try {
            const code = Math.random().toString(36).slice(2, 8).toUpperCase();
            await setDoc(doc(db, "teams", code), { name, coachUid: user.uid, coachName: profile?.playerName || user.email, createdAt: serverTimestamp() });
            setTeamCode(code);
            setTeamData({ name, coachUid: user.uid, coachName: profile?.playerName || "" });
            setStatus("");
        } catch (err) { console.error(err); }
    }

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div>
                    <div className={styles.eyebrow}>Coach</div>
                    <h1 className={styles.h1}>Coach Dashboard</h1>
                    <p>{status || `${players.length} players on roster`}</p>
                </div>
                <Link className={styles.navPill} to="/">Back to Calculator</Link>
            </section>
            {user && (profile?.role === "coach" || profile?.role === "admin") && (
                <>
                    <section className={styles.metricsGrid}>
                        <div className={styles.metricCard}><span>Team</span><strong>{teamData?.name || "--"}</strong></div>
                        <div className={styles.metricCard}><span>Code</span><strong>{teamCode || "--"}</strong></div>
                        <div className={styles.metricCard}><span>Players</span><strong>{players.length}</strong></div>
                    </section>
                    {!teamData && (
                        <form className={styles.panel} onSubmit={handleCreateTeam}>
                            <h2>Create a Team</h2>
                            <div className={styles.formGrid}>
                                <label>Team Name<input name="teamName" required placeholder="Your team name" /></label>
                            </div>
                            <div className={styles.btnRow}><button type="submit" className={styles.navPill}>Create Team</button></div>
                        </form>
                    )}
                    {players.length > 0 && (
                        <section className={styles.panel}>
                            <h2>Roster</h2>
                            <div className={styles.matchList}>
                                {players.map((p) => (
                                    <div key={p.id} className={styles.matchCard}>
                                        <div className={styles.matchHeader}><strong>{p.playerName || p.id}</strong><span>{(p.position || "").toUpperCase()}</span></div>
                                        <div className={styles.matchMeta}><span>Age: {p.age || "—"}</span></div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
            {user && profile?.role !== "coach" && profile?.role !== "admin" && (
                <section className={styles.panel}><h2>Coach Access Required</h2><p>Your account role is &quot;{profile?.role || "player"}&quot;. Contact the administrator if you need coach access.</p></section>
            )}
            {/* Onboarding progress banner */}
            {user && !profile?.onboardingComplete && (
                <section className={styles.panel} style={{ background: "var(--color-accent-subtle, #eff6ff)", borderLeft: "3px solid var(--color-accent, #2563eb)" }}>
                    <strong>Finish setting up your coach profile</strong>
                    <p style={{ fontSize: "0.85rem", margin: "4px 0 8px", opacity: 0.8 }}>
                        {profile?.teamCode
                            ? "Step 4 of 4 — Share your invite link with players."
                            : profile?.role === "coach"
                            ? "Step 3 of 4 — Create your team to get a player invite link."
                            : "Step 2 of 4 — Set your role as coach."}
                    </p>
                    <Link className={styles.navPill} to="/onboarding" style={{ fontSize: "0.8rem" }}>
                        Continue Setup →
                    </Link>
                </section>
            )}

            {/* Join requests */}
            {pendingRequests.length > 0 && (
                <section className={styles.panel}>
                    <h2>Pending Join Requests ({pendingRequests.length})</h2>
                    <div className={styles.matchList}>
                        {pendingRequests.map((r) => (
                            <div key={r.id} className={styles.matchCard}>
                                <div className={styles.matchHeader}>
                                    <strong>{r.playerName || r.email}</strong>
                                    <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>{r.position?.toUpperCase()}</span>
                                </div>
                                <div className={styles.matchMeta}>
                                    <span>{r.email}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
