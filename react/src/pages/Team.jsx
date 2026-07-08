import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import styles from "../styles/AppPage.module.css";
import { useMeta } from "../hooks/useMeta.js";

export default function Team() {
    const { user, profile, loading } = useAuth();
    const [status, setStatus] = useState("Checking your team...");
    const [teamData, setTeamData] = useState(null);
    const [teammates, setTeammates] = useState([]);
    const [joinCode, setJoinCode] = useState("");
    const [feedback, setFeedback] = useState("");

    useMeta("Team Roster | Veyro", "View your team roster, member ratings, and recent match activity in the Veyro team dashboard.");

    useEffect(() => {
        if (loading || !user || !profile) return;
        async function loadTeam() {
            if (!profile.teamId) { setStatus("No team joined yet."); return; }
            try {
                const teamSnap = await getDoc(doc(db, "teams", profile.teamId));
                if (!teamSnap.exists()) { setStatus("Team not found."); return; }
                const team = teamSnap.data();
                setTeamData(team);
                const memberQ = query(collection(db, "users"), where("teamId", "==", profile.teamId));
                const memberSnap = await getDocs(memberQ);
                setTeammates(memberSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
                setStatus("");
            } catch (err) { console.error(err); setStatus("Could not load team data."); }
        }
        loadTeam();
    }, [user, profile, loading]);

    async function handleJoin() {
        if (!joinCode.trim() || !user) return;
        setFeedback("Joining...");
        try {
            const teamSnap = await getDoc(doc(db, "teams", joinCode.trim()));
            if (!teamSnap.exists()) { setFeedback("Team code not found."); return; }
            await updateDoc(doc(db, "users", user.uid), { teamId: joinCode.trim() });
            setFeedback("Joined team! Refresh to see details.");
        } catch (err) { console.error(err); setFeedback("Could not join team."); }
    }

    async function handleLeave() {
        if (!user || !profile?.teamId) return;
        try {
            await updateDoc(doc(db, "users", user.uid), { teamId: null });
            setTeamData(null);
            setTeammates([]);
            setStatus("You left the team.");
        } catch (err) { console.error(err); }
    }

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div>
                    <div className={styles.eyebrow}>Player Team</div>
                    <h1 className={styles.h1}>My Team</h1>
                    <p>{status || teamData?.name || "Team loaded"}</p>
                </div>
                <Link className={styles.navPill} to="/vault">Back to Vault</Link>
            </section>
            <section className={styles.metricsGrid}>
                <div className={styles.metricCard}><span>Team</span><strong>{teamData?.name || "--"}</strong></div>
                <div className={styles.metricCard}><span>Coach</span><strong>{teamData?.coachName || "--"}</strong></div>
                <div className={styles.metricCard}><span>Teammates</span><strong>{teammates.length}</strong></div>
                <div className={styles.metricCard}><span>Request</span><strong>{profile?.teamId ? "Active" : "--"}</strong></div>
            </section>
            <div className={styles.teamLayout}>
                <section className={styles.panel}>
                    <h2>Team Details</h2>
                    <p>{teamData ? `You are part of ${teamData.name}.` : "Your team code and coach info will show here after you join a team."}</p>
                    <div className={styles.teamCode}><span>Team code</span><strong>{profile?.teamId || "----"}</strong></div>
                    <div className={styles.joinRow}>
                        <input type="text" placeholder="Enter team code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
                        <button className={styles.navPill} onClick={handleJoin}>Join Team</button>
                    </div>
                    {profile?.teamId && <button className={styles.dangerBtn} onClick={handleLeave} style={{ marginTop: 10 }}>Leave Current Team</button>}
                    {feedback && <div className={styles.feedback}>{feedback}</div>}
                </section>
                <section className={styles.panel}>
                    <h2>Teammates</h2>
                    {teammates.length === 0 ? <div className={styles.empty}>No teammates loaded yet.</div> : (
                        <div className={styles.matchList}>
                            {teammates.map((t) => (
                                <div key={t.id} className={styles.matchCard}><strong>{t.playerName || t.id}</strong><span> — {(t.position || "").toUpperCase()}</span></div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
