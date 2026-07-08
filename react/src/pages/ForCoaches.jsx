import { useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/ForCoaches.module.css";
import { useMeta } from "../hooks/useMeta.js";

export default function ForCoaches() {
    useMeta("Soccer Team Performance Tracker for Coaches | Veyro", "Veyro for coaches. Collect player match ratings, review saved stats, and spot development trends across your whole team roster.");

    return (
        <main className={styles.coachPage}>
            <section className={styles.coachHero}>
                <h1>Veyro for soccer coaches.</h1>
                <p>Veyro gives coaches a simple way to collect player match ratings, review saved stats, and spot development trends without building spreadsheets from scratch.</p>
                <div className={styles.actions}>
                    <Link className={styles.button} to="/">Try the Calculator</Link>
                    <Link className={styles.button} to="/soccer-performance-guide">Share Player Guide</Link>
                    <Link className={styles.button} to="/coach">Open Coach Dashboard</Link>
                </div>
            </section>
            <section className={styles.coachSection}>
                <h2>How teams use it.</h2>
                <div className={styles.grid}>
                    <div className={styles.card}><strong>Create a team code</strong><span>A coach account creates a private team code players can use when they sign up or join later.</span></div>
                    <div className={styles.card}><strong>Players save matches</strong><span>Players enter match details, ratings, position-specific stats, minutes, scoreline, and opponent.</span></div>
                    <div className={styles.card}><strong>Coaches review trends</strong><span>The coach dashboard shows roster activity, game counts, averages, recent leaders, and team stat totals.</span></div>
                </div>
            </section>
            <section className={styles.coachSection}>
                <h2>Why it helps player development.</h2>
                <p>Veyro is built for reflection after real games. It helps players connect actions to outcomes, gives coaches a cleaner view of progress over time, and creates a shared language around improvement. Coaches can also share the <Link to="/soccer-performance-guide">soccer player performance guide</Link> with players and parents.</p>
            </section>
            <section className={styles.coachSection}>
                <h2>Coach FAQ.</h2>
                <div className={styles.grid}>
                    <div className={styles.card}><strong>Do players need accounts?</strong><span>Yes, saved ratings belong to player accounts so each player keeps their own history.</span></div>
                    <div className={styles.card}><strong>Can a coach approve players?</strong><span>Yes. Players request to join with a team code, and the coach can approve or reject requests.</span></div>
                    <div className={styles.card}><strong>Is it only for one position?</strong><span>No. Veyro supports goalkeeper, defender, midfielder, and attacker ratings.</span></div>
                </div>
            </section>
        </main>
    );
}
