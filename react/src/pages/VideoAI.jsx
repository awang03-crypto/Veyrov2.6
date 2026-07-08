import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { canUseFeature, PLAN_FEATURES, planGateMessage } from "../services/monetization";
import styles from "../styles/AppPage.module.css";
import { useMeta } from "../hooks/useMeta.js";

export default function VideoAI() {
    const { user, profile, loading } = useAuth();
    const [accepted, setAccepted] = useState(false);
    const [status, setStatus] = useState("");
    const [result, setResult] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const videoRef = useRef(null);

    useMeta("Video AI Match Analysis | Veyro", "Upload match footage and let Veyro AI extract player stats automatically. Premium feature for deep performance analysis.");

    async function handleAnalyze() {
        if (!canUseFeature(profile, PLAN_FEATURES.VIDEO_AI, user)) {
            setStatus(planGateMessage(PLAN_FEATURES.VIDEO_AI));
            return;
        }
        if (!videoRef.current?.files?.[0]) { setStatus("Select a video file first."); return; }
        setAnalyzing(true);
        setStatus("Uploading and analyzing video...");
        try {
            const formData = new FormData();
            formData.append("video", videoRef.current.files[0]);
            formData.append("playerNumber", document.getElementById("playerNumber")?.value || "");
            formData.append("position", document.getElementById("playerPosition")?.value || "mid");
            formData.append("teamColor", document.getElementById("teamColor")?.value || "");
            formData.append("opponentColor", document.getElementById("opponentColor")?.value || "");
            formData.append("playerDescription", document.getElementById("playerDescription")?.value || "");
            formData.append("analysisDepth", document.getElementById("analysisDepth")?.value || "balanced");
            formData.append("extraInstructions", document.getElementById("extraInstructions")?.value || "");
            const token = await user?.getIdToken?.();
            const res = await fetch("/api/analyze-video", {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData
            });
            if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
            const data = await res.json();
            setResult(data);
            setStatus("Analysis complete.");
        } catch (err) { console.error(err); setStatus(`Error: ${err.message}`); }
        setAnalyzing(false);
    }

    if (!accepted) {
        return (
            <div className={styles.warningGate}>
                <section className={styles.warningCard}>
                    <div className={styles.eyebrow}>Important Warning</div>
                    <h2>Video AI is not finished.</h2>
                    <p>This tool is experimental and can be very inaccurate. It may track the wrong player, miss touches, count the wrong passes, or make up events that did not happen. Please check every stat before saving or sharing anything.</p>
                    <ul className={styles.warningList}>
                        <li>Do not trust the numbers until you review them yourself.</li>
                        <li>Use Correction Mode to fix wrong stats before saving.</li>
                        <li>Short clear clips work better than full games or blurry video.</li>
                    </ul>
                    <label className={styles.warningAck}>
                        <input type="checkbox" onChange={(e) => { if (e.target.checked) setAccepted(true); }} />
                        OK, I understand
                    </label>
                </section>
            </div>
        );
    }

    const videoAllowed = canUseFeature(profile, PLAN_FEATURES.VIDEO_AI, user);

    return (
        <main className={`page ${styles.appPage}`}>
            <section className={styles.hero}>
                <div>
                    <div className={styles.eyebrow}>Video AI Agent</div>
                    <h1 className={styles.h1}>Analyze a full soccer game.</h1>
                    <p>Upload a match video, enter the player number, add visual clues, and send it to an AI-powered backend that tracks the player, builds an event timeline, and returns calculator-ready stats.</p>
                </div>
                <Link className={styles.navPill} to="/">Back to Calculator</Link>
            </section>
            <div className={styles.layout}>
                <section className={styles.panel}>
                    <h2>Game Video</h2>
                    {!loading && !videoAllowed && (
                        <div className={styles.lockCard}>
                            <strong>Premium required</strong>
                            <p>{user ? planGateMessage(PLAN_FEATURES.VIDEO_AI) : "Sign in first, then use a Premium-enabled account to run Video AI."}</p>
                        </div>
                    )}
                    <div className={styles.formGrid}>
                        <label>Soccer Game Video<input type="file" ref={videoRef} accept="video/*" /></label>
                        <div className={styles.twoCol}>
                            <label>Player Number<input type="number" id="playerNumber" min="0" max="99" placeholder="e.g., 10" /></label>
                            <label>Position<select id="playerPosition"><option value="mid">Midfielder</option><option value="att">Attacker</option><option value="def">Defender</option><option value="gk">Goalkeeper</option></select></label>
                        </div>
                        <div className={styles.twoCol}>
                            <label>Team Color<input type="text" id="teamColor" placeholder="e.g., white shirts" /></label>
                            <label>Opponent Color<input type="text" id="opponentColor" placeholder="e.g., red shirts" /></label>
                        </div>
                        <label>Player Description<input type="text" id="playerDescription" placeholder="e.g., #31, white team, tall midfielder" /></label>
                        <div className={styles.twoCol}>
                            <label>Starting Location<input type="text" id="startingLocation" placeholder="e.g., first seen at 0:20 near right wing" /></label>
                            <label>Analysis Speed<select id="analysisDepth"><option value="fast">Fast</option><option value="balanced">Balanced</option><option value="detailed">Detailed</option></select></label>
                        </div>
                        <label>Extra Instructions<textarea id="extraInstructions" placeholder="Any additional details..." /></label>
                    </div>
                    <div className={styles.btnRow}>
                        <button className={styles.navPill} onClick={handleAnalyze} disabled={analyzing || loading || !videoAllowed}>{analyzing ? "Analyzing..." : "Analyze Video"}</button>
                    </div>
                    {status && <div className={styles.statusLine}>{status}</div>}
                </section>
                {result && (
                    <section className={styles.panel}>
                        <h2>Analysis Results</h2>
                        <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem", color: "var(--muted)" }}>{JSON.stringify(result, null, 2)}</pre>
                    </section>
                )}
            </div>
        </main>
    );
}
