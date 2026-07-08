import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { canSaveMatch, planGateMessage, PLAN_FEATURES, normalizePlanTier, PLAN_LIMITS } from "../services/monetization";
import styles from "../styles/AppPage.module.css";
import { useMeta } from "../hooks/useMeta.js";

export default function Vault() {
    const { user, profile, loading } = useAuth();
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [status, setStatus] = useState("Loading saved games...");
    const [pending, setPending] = useState(null);
    const [saveForm, setSaveForm] = useState({ opponent: "", date: "", result: "", scoreline: "", notes: "" });
    const [saving, setSaving] = useState(false);
    const [gateMessage, setGateMessage] = useState("");

    useMeta("Match Vault | Saved Games | Veyro", "Your saved soccer match ratings and stats history. Track performance trends and review every game you have saved.");

    // Read pending rating data from Calculator
    useEffect(() => {
        const raw = sessionStorage.getItem("pendingRatingData");
        if (raw) {
            try { setPending(JSON.parse(raw)); } catch { /* ignore */ }
            sessionStorage.removeItem("pendingRatingData");
        }
    }, []);

    useEffect(() => {
        if (loading || !user) { setStatus(user ? "Loading..." : "Sign in to view your saved games."); return; }
        loadGames();
    }, [user, loading]);

    // Check entitlement whenever games or profile changes
    useEffect(() => {
        if (!pending) return;
        const allowed = canSaveMatch(profile, games.length, user);
        if (!allowed) {
            setGateMessage(planGateMessage(PLAN_FEATURES.SAVE_MATCH, games.length));
        } else {
            setGateMessage("");
        }
    }, [games, profile, user, pending]);

    async function loadGames() {
        try {
            const q = query(collection(db, "users", user.uid, "ratings"), orderBy("timestamp", "desc"));
            const snap = await getDocs(q);
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setGames(list);
            setStatus(list.length ? "" : "No saved games yet. Use the calculator to save your first match.");
        } catch (err) { console.error(err); setStatus("Could not load saved games."); }
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!user || !pending) return;

        // Enforce free tier 5-match limit
        if (!canSaveMatch(profile, games.length, user)) {
            setGateMessage(planGateMessage(PLAN_FEATURES.SAVE_MATCH, games.length));
            return;
        }

        setSaving(true);
        try {
            await addDoc(collection(db, "users", user.uid, "ratings"), {
                finalRating: pending.finalScore,
                position: pending.position,
                stats: pending.statInputs || {},
                decisiveInputs: pending.decisiveInputs || {},
                opponent: saveForm.opponent.trim(),
                date: saveForm.date,
                result: saveForm.result,
                scoreline: saveForm.scoreline.trim(),
                notes: saveForm.notes.trim(),
                sport: "soccer",
                timestamp: serverTimestamp(),
            });
            setPending(null);
            setSaveForm({ opponent: "", date: "", result: "", scoreline: "", notes: "" });
            await loadGames();
            setStatus(`Saved! You now have ${games.length + 1} saved game${games.length + 1 === 1 ? "" : "s"}.`);
        } catch (err) {
            console.error(err);
            setStatus("Could not save. Please try again.");
        }
        setSaving(false);
    }

    async function handleDelete(id) {
        try {
            await deleteDoc(doc(db, "users", user.uid, "ratings", id));
            setGames((prev) => prev.filter((g) => g.id !== id));
        } catch (err) { console.error(err); }
    }

    // Tier info for display
    const tier = normalizePlanTier(profile);
    const limit = PLAN_LIMITS[tier].savedMatches;
    const atLimit = limit !== Infinity && games.length >= limit;

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div>
                    <div className={styles.eyebrow}>Match Vault</div>
                    <h1 className={styles.h1}>Saved Games</h1>
                    <p>{status || `${games.length} saved ${games.length === 1 ? "game" : "games"}`}</p>
                </div>
                <Link className={styles.navPill} to="/">Back to Calculator</Link>
            </section>

            {!loading && !user && (
                <section className={styles.panel}>
                    <h2>Sign in required</h2>
                    <p>The vault stores saved match ratings tied to your account. <Link to="/">Sign in or create an account</Link> to get started.</p>
                </section>
            )}

            {/* Free tier limit banner */}
            {user && limit !== Infinity && (
                <section className={styles.panel} style={{ background: atLimit ? "var(--color-error-subtle, #fff0f0)" : undefined }}>
                    <p style={{ margin: 0, fontSize: "0.9rem" }}>
                        {atLimit
                            ? <>⚠️ You've reached the free 5-match limit. <strong>Upgrade to Coach or Premium</strong> to save unlimited matches.</>
                            : <>{games.length} / {limit} free saves used.</>
                        }
                    </p>
                </section>
            )}

            {/* Save form — shown when Calculator sends a pending rating */}
            {pending && user && (
                <section className={styles.panel}>
                    <h2>Save Match — Rating: {pending.finalScore}/100</h2>
                    {gateMessage ? (
                        <div style={{ color: "var(--color-error, red)", padding: "12px 0" }}>
                            <strong>{gateMessage}</strong>
                            <p>Upgrade your plan to save more matches.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <label>Opponent
                                <input type="text" placeholder="e.g. City FC" value={saveForm.opponent} onChange={(e) => setSaveForm((p) => ({ ...p, opponent: e.target.value }))} />
                            </label>
                            <label>Date
                                <input type="date" value={saveForm.date} onChange={(e) => setSaveForm((p) => ({ ...p, date: e.target.value }))} />
                            </label>
                            <label>Result
                                <select value={saveForm.result} onChange={(e) => setSaveForm((p) => ({ ...p, result: e.target.value }))}>
                                    <option value="">— Select —</option>
                                    <option value="Win">Win</option>
                                    <option value="Draw">Draw</option>
                                    <option value="Loss">Loss</option>
                                </select>
                            </label>
                            <label>Scoreline
                                <input type="text" placeholder="e.g. 2-1" value={saveForm.scoreline} onChange={(e) => setSaveForm((p) => ({ ...p, scoreline: e.target.value }))} />
                            </label>
                            <label>Notes
                                <textarea placeholder="Any notes about the match..." value={saveForm.notes} onChange={(e) => setSaveForm((p) => ({ ...p, notes: e.target.value }))} rows={3} />
                            </label>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button className={styles.navPill} type="submit" disabled={saving}>{saving ? "Saving..." : "Save Match"}</button>
                                <button className={styles.navPill} type="button" style={{ opacity: 0.6 }} onClick={() => setPending(null)}>Discard</button>
                            </div>
                        </form>
                    )}
                </section>
            )}

            {games.length > 0 && (
                <section className={styles.panel}>
                    <h2>Match History</h2>
                    <div className={styles.matchList}>
                        {games.map((g) => (
                            <div key={g.id} className={styles.matchCard}>
                                <div className={styles.matchHeader}>
                                    <strong>{g.opponent || "Unknown Opponent"}</strong>
                                    <span className={styles.matchRating}>{Math.round(g.finalRating || g.rating || 0)}</span>
                                </div>
                                <div className={styles.matchMeta}>
                                    <span>{g.date || "No date"}</span>
                                    <span>{g.position?.toUpperCase() || "—"}</span>
                                    <span>{g.minutes ? `${g.minutes} min` : ""}</span>
                                    <span>{g.result || ""}</span>
                                    {g.scoreline && <span>{g.scoreline}</span>}
                                </div>
                                {g.notes && <p style={{ fontSize: "0.85rem", opacity: 0.7, margin: "4px 0 0" }}>{g.notes}</p>}
                                <button
                                    onClick={() => handleDelete(g.id)}
                                    style={{ marginTop: 8, fontSize: "0.75rem", opacity: 0.5, background: "none", border: "none", cursor: "pointer", color: "inherit" }}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
