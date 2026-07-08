import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import styles from "../styles/AppPage.module.css";

export default function JoinTeam() {
    const { code } = useParams();
    const { user, profile, loading } = useAuth();
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [status, setStatus] = useState("Looking up team...");
    const [joining, setJoining] = useState(false);
    const [joined, setJoined] = useState(false);
    const [alreadyMember, setAlreadyMember] = useState(false);

    useEffect(() => { document.title = "Join Team | Veyro"; }, []);

    useEffect(() => {
        if (!code) { setStatus("Invalid invite link."); return; }
        async function lookupTeam() {
            try {
                const snap = await getDoc(doc(db, "teams", code.toUpperCase()));
                if (!snap.exists()) { setStatus("Team not found. Check your invite link and try again."); return; }
                setTeam({ id: snap.id, ...snap.data() });
                setStatus("");
            } catch (err) { setStatus("Could not load team. Please try again."); }
        }
        lookupTeam();
    }, [code]);

    useEffect(() => {
        if (!user || !profile) return;
        if (profile.teamId === code?.toUpperCase()) setAlreadyMember(true);
    }, [user, profile, code]);

    async function handleJoin() {
        if (!user || !team) return;
        setJoining(true);
        try {
            // Add join request to team's requests subcollection
            await setDoc(doc(db, "teams", team.id, "requests", user.uid), {
                uid: user.uid,
                email: user.email,
                playerName: profile?.playerName || user.email,
                position: profile?.position || "mid",
                requestedAt: serverTimestamp(),
                status: "pending"
            });
            // Mark user as pending on their profile
            await setDoc(doc(db, "users", user.uid), {
                pendingTeamId: team.id,
                pendingTeamName: team.name,
                updatedAt: serverTimestamp()
            }, { merge: true });
            setJoined(true);
            setStatus("");
        } catch (err) { setStatus("Could not send join request. Please try again."); }
        setJoining(false);
    }

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div>
                    <div className={styles.eyebrow}>Team Invite</div>
                    <h1 className={styles.h1}>Join a Team</h1>
                    {team && <p>You've been invited to join <strong>{team.name}</strong></p>}
                </div>
                <Link className={styles.navPill} to="/">Home</Link>
            </section>

            {status && (
                <section className={styles.panel}>
                    <p>{status}</p>
                </section>
            )}

            {team && !joined && !alreadyMember && (
                <section className={styles.panel}>
                    <h2>{team.name}</h2>
                    <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>
                        Coached by {team.coachName || "your coach"} · Team code: <strong>{team.id}</strong>
                    </p>

                    {!user && !loading && (
                        <>
                            <p>You need a Veyro account to join this team. Create one for free — it only takes a minute.</p>
                            <Link className={styles.navPill} to="/">Sign Up / Sign In</Link>
                        </>
                    )}

                    {user && (
                        <>
                            <p>Tap below to send a join request to your coach. They'll approve it from their Coach Dashboard.</p>
                            <button className={styles.navPill} onClick={handleJoin} disabled={joining}>
                                {joining ? "Sending request..." : `Request to Join ${team.name}`}
                            </button>
                        </>
                    )}
                </section>
            )}

            {joined && (
                <section className={styles.panel}>
                    <h2>Request Sent ✓</h2>
                    <p>Your join request has been sent to <strong>{team?.name}</strong>. Your coach will approve it from their Coach Dashboard — you'll have access to team features once they do.</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                        <Link className={styles.navPill} to="/">Go to Calculator</Link>
                        <Link className={styles.navPill} to="/vault">Open Vault</Link>
                    </div>
                </section>
            )}

            {alreadyMember && (
                <section className={styles.panel}>
                    <h2>You're already on this team</h2>
                    <p>You're already a member of <strong>{team?.name}</strong>.</p>
                    <Link className={styles.navPill} to="/team">Go to Team Page</Link>
                </section>
            )}
        </main>
    );
}
