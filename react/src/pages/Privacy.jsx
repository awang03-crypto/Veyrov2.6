import { useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/Privacy.module.css";
import { useMeta } from "../hooks/useMeta.js";

export default function Privacy() {
    useMeta("Privacy Policy | Veyro", "Veyro privacy policy. Learn how we collect, store, and protect your player performance data.");

    return (
        <main className={`page ${styles.privacyPage}`}>
            <section className={styles.hero}>
                <div className={styles.eyebrow}>Privacy &amp; Account</div>
                <h1 className={styles.h1}>Your data should be clear.</h1>
                <p className={styles.p}>Veyro stores the information needed to save your games, show trends, connect teams, and improve the product. This page explains what is stored and how to ask for changes or deletion.</p>
                <div className={styles.actionRow}>
                    <Link className={styles.navPill} to="/contact">Request Data Help</Link>
                    <Link className={`${styles.navPill} ${styles.secondary}`} to="/">Back to Calculator</Link>
                </div>
            </section>
            <section className={styles.grid}>
                <article className={styles.panel}>
                    <h2>What gets stored</h2>
                    <ul>
                        <li>Your email, player name, age, position, role, and team connection.</li>
                        <li>Saved match details like opponent, date, scoreline, minutes, rating, and calculator inputs.</li>
                        <li>Optional feedback messages and basic site events like signup, signin, or guest visits.</li>
                    </ul>
                </article>
                <article className={styles.panel}>
                    <h2>Who can see it</h2>
                    <ul>
                        <li>You can see your own saved ratings and profile data.</li>
                        <li>Your coach can see team roster data and ratings connected to that team.</li>
                        <li>Public comparison only uses your stats if you turn comparison sharing on.</li>
                    </ul>
                </article>
                <article className={styles.panel}>
                    <h2>Video AI</h2>
                    <ul>
                        <li>Uploaded videos are used for analysis and then removed from the server after the request finishes.</li>
                        <li>AI results can be wrong, so you should always check and correct the stats before saving.</li>
                        <li>Corrections may be saved as lessons to improve future analysis behavior.</li>
                    </ul>
                </article>
                <article className={styles.panel}>
                    <h2>Delete or export</h2>
                    <ul>
                        <li>Use Contact Us to request account deletion, saved-game deletion, or a data export.</li>
                        <li>Include the email address on your Veyro account so the request can be verified.</li>
                        <li>Security logs are private and only used to protect the app from abuse.</li>
                    </ul>
                </article>
            </section>
        </main>
    );
}
