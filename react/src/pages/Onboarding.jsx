import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import styles from "../styles/AppPage.module.css";
import { useMeta } from "../hooks/useMeta.js";

const STEPS = [
    { id: "account", label: "Create Account", hint: "Sign in to get started" },
    { id: "role", label: "Set Role", hint: "Tell us you're a coach" },
    { id: "team", label: "Create Team", hint: "Name your team and get a code" },
    { id: "invite", label: "Share Invite Link", hint: "Bring your players in" },
];

export default function Onboarding() {
    const { user, profile, loading } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [teamCode, setTeamCode] = useState("");
    const [teamName, setTeamName] = useState("");
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState("");
    const [copied, setCopied] = useState(false);

    useMeta("Coach Setup | Veyro", "Set up your Veyro coach account in four steps. Create your team, get a join code, and invite your players.");

    // Restore progress from Firestore profile
    useEffect(() => {
        if (loading || !user || !profile) return;
        const progress = profile.onboardingStep || 0;
        if (profile.role === "coach" && progress >= 1) setStep(Math.max(step, 1));
        if (profile.teamCode) { setTeamCode(profile.teamCode); setStep(Math.max(step, 3)); }
        if (profile.onboardingComplete) setStep(3);
    }, [loading, user, profile]);

    // Step 0 — account (just needs to be signed in)
    useEffect(() => {
        if (!loading && user && step === 0) setStep(1);
    }, [loading, user, step]);

    async function handleSetRole() {
        if (!user) return;
        setSaving(true);
        try {
            await setDoc(doc(db, "users", user.uid), {
                role: "coach",
                onboardingStep: 1,
                updatedAt: serverTimestamp()
            }, { merge: true });
            setStep(2);
        } catch (err) { setStatus("Could not save role. Please try again."); }
        setSaving(false);
    }

    async function handleCreateTeam(e) {
        e.preventDefault();
        if (!user || !teamName.trim()) return;
        setSaving(true);
        try {
            const code = Math.random().toString(36).slice(2, 8).toUpperCase();
            await setDoc(doc(db, "teams", code), {
                name: teamName.trim(),
                coachUid: user.uid,
                coachName: profile?.playerName || user.email,
                createdAt: serverTimestamp(),
                memberCount: 0,
            });
            await setDoc(doc(db, "users", user.uid), {
                teamCode: code,
                teamName: teamName.trim(),
                onboardingStep: 2,
                updatedAt: serverTimestamp()
            }, { merge: true });
            setTeamCode(code);
            setStep(3);
        } catch (err) { setStatus("Could not create team. Please try again."); }
        setSaving(false);
    }

    async function handleComplete() {
        if (!user) return;
        await setDoc(doc(db, "users", user.uid), {
            onboardingComplete: true,
            onboardingStep: 3,
            updatedAt: serverTimestamp()
        }, { merge: true });
        navigate("/coach");
    }

    function copyInviteLink() {
        const link = `${window.location.origin}/join/${teamCode}`;
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    const inviteLink = teamCode ? `${window.location.origin}/join/${teamCode}` : "";

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div>
                    <div className={styles.eyebrow}>Coach Setup</div>
                    <h1 className={styles.h1}>Welcome to Veyro Coach</h1>
                    <p>Get your team set up in 4 steps.</p>
                </div>
                <Link className={styles.navPill} to="/">Back</Link>
            </section>

            {/* Progress bar */}
            <section className={styles.panel}>
                <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                    {STEPS.map((s, i) => (
                        <div key={s.id} style={{
                            flex: 1, padding: "10px 8px", borderRadius: 8, textAlign: "center", fontSize: "0.75rem",
                            background: i <= step ? "var(--color-accent, #2563eb)" : "var(--color-surface-secondary, #f3f4f6)",
                            color: i <= step ? "#fff" : "var(--color-text-secondary)",
                            fontWeight: i === step ? 600 : 400,
                            transition: "all 0.2s"
                        }}>
                            <div style={{ fontSize: "1rem", marginBottom: 2 }}>{i < step ? "✓" : i + 1}</div>
                            <div>{s.label}</div>
                        </div>
                    ))}
                </div>
                <p style={{ fontSize: "0.85rem", opacity: 0.6, margin: 0 }}>
                    {step + 1} of {STEPS.length} — {STEPS[Math.min(step, STEPS.length - 1)].hint}
                </p>
            </section>

            {/* Step 0: Account */}
            {step === 0 && (
                <section className={styles.panel}>
                    <h2>Step 1: Create Account</h2>
                    <p>You need a Veyro account to set up a coach profile. Sign in or create an account to continue.</p>
                    <Link className={styles.navPill} to="/">Sign In / Create Account</Link>
                </section>
            )}

            {/* Step 1: Set role */}
            {step === 1 && (
                <section className={styles.panel}>
                    <h2>Step 2: Set Your Role as Coach</h2>
                    <p>This unlocks team creation, roster management, and team trends for your account.</p>
                    {status && <p style={{ color: "var(--color-error, red)" }}>{status}</p>}
                    <button className={styles.navPill} onClick={handleSetRole} disabled={saving}>
                        {saving ? "Saving..." : "I'm a Coach — Continue"}
                    </button>
                </section>
            )}

            {/* Step 2: Create team */}
            {step === 2 && (
                <section className={styles.panel}>
                    <h2>Step 3: Create Your Team</h2>
                    <p>Give your team a name. We'll generate a unique join code your players can use.</p>
                    {status && <p style={{ color: "var(--color-error, red)" }}>{status}</p>}
                    <form onSubmit={handleCreateTeam} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <label>Team Name
                            <input
                                type="text"
                                placeholder="e.g. City FC U16"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                required
                                maxLength={60}
                            />
                        </label>
                        <button className={styles.navPill} type="submit" disabled={saving || !teamName.trim()}>
                            {saving ? "Creating..." : "Create Team"}
                        </button>
                    </form>
                </section>
            )}

            {/* Step 3: Share invite link */}
            {step === 3 && teamCode && (
                <section className={styles.panel}>
                    <h2>Step 4: Share Your Invite Link</h2>
                    <p>Share this link with your players. When they open it, they can request to join your team.</p>

                    <div style={{ background: "var(--color-surface-secondary, #f3f4f6)", borderRadius: 8, padding: 16, margin: "16px 0", fontFamily: "monospace", fontSize: "0.9rem", wordBreak: "break-all" }}>
                        {inviteLink}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className={styles.navPill} onClick={copyInviteLink}>
                            {copied ? "✓ Copied!" : "Copy Link"}
                        </button>
                        <button className={styles.navPill} onClick={handleComplete}>
                            Go to Coach Dashboard →
                        </button>
                    </div>

                    <div style={{ marginTop: 20, padding: 16, border: "1px solid var(--color-border-secondary)", borderRadius: 8 }}>
                        <strong>Your Team Code: {teamCode}</strong>
                        <p style={{ fontSize: "0.85rem", opacity: 0.7, margin: "4px 0 0" }}>
                            Players can also enter this code manually at <em>{window.location.origin}/join/{teamCode}</em>
                        </p>
                    </div>

                    <div style={{ marginTop: 16, fontSize: "0.85rem", opacity: 0.6 }}>
                        <strong>3 steps to add your first player:</strong>
                        <ol style={{ margin: "8px 0 0", paddingLeft: 20, lineHeight: 1.8 }}>
                            <li>Copy the invite link above</li>
                            <li>Send it to your players via message or email</li>
                            <li>Approve join requests from your Coach Dashboard</li>
                        </ol>
                    </div>
                </section>
            )}
        </main>
    );
}
