import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import styles from "../styles/AppPage.module.css";
import { useMeta } from "../hooks/useMeta.js";

export default function Profile() {
    const { user, profile, loading } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useMeta("Player Profile | Veyro", "Your Veyro player profile. View average rating, best position, strengths, and full match history.");

    async function handleSave(e) {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        const fd = new FormData(e.target);
        try {
            await updateDoc(doc(db, "users", user.uid), { playerName: fd.get("name"), age: Number(fd.get("age")) || null, position: fd.get("position") });
            setEditing(false);
        } catch (err) { console.error(err); }
        setSaving(false);
    }

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div>
                    <div className={styles.eyebrow}>Account</div>
                    <h1 className={styles.h1}>My Profile</h1>
                    <p>{loading ? "Loading..." : user ? user.email : "Sign in to view your profile."}</p>
                </div>
                <Link className={styles.navPill} to="/vault">Back to Vault</Link>
            </section>
            {user && profile && !editing && (
                <section className={styles.panel}>
                    <h2>Player Info</h2>
                    <p><strong>Name:</strong> {profile.playerName || "—"}</p>
                    <p><strong>Position:</strong> {(profile.position || "—").toUpperCase()}</p>
                    <p><strong>Age:</strong> {profile.age || "—"}</p>
                    <p><strong>Role:</strong> {profile.role || "player"}</p>
                    <div className={styles.btnRow}>
                        <button className={styles.navPill} onClick={() => setEditing(true)}>Edit Profile</button>
                    </div>
                </section>
            )}
            {user && editing && (
                <form className={styles.panel} onSubmit={handleSave}>
                    <h2>Edit Profile</h2>
                    <div className={styles.formGrid}>
                        <label>Player Name<input name="name" defaultValue={profile?.playerName || ""} /></label>
                        <label>Age<input name="age" type="number" min="5" max="99" defaultValue={profile?.age || ""} /></label>
                        <label>Position<select name="position" defaultValue={profile?.position || "mid"}><option value="mid">Midfielder</option><option value="att">Attacker</option><option value="def">Defender</option><option value="gk">Goalkeeper</option></select></label>
                    </div>
                    <div className={styles.btnRow}>
                        <button type="submit" className={styles.navPill} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                        <button type="button" className={`${styles.navPill} ${styles.secondary}`} onClick={() => setEditing(false)}>Cancel</button>
                    </div>
                </form>
            )}
        </main>
    );
}
