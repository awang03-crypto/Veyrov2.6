import { useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/OtherSports.module.css";
import { useMeta } from "../hooks/useMeta.js";

export default function OtherSports() {
    useMeta("Basketball & Football Rating Calculator | Veyro", "Rate basketball and football player performances with position-specific stat formulas. Free calculator for all three sports.");

    return (
        <main className={`page ${styles.otherPage}`}>
            <section className={styles.hero}>
                <div className={styles.eyebrow}>Other Sports</div>
                <h1 className={styles.h1}>Veyro may expand beyond soccer.</h1>
                <p className={styles.heroP}>The soccer tracker is the main public app right now. Veyro is also testing how basketball, football, baseball, and lacrosse could use the same idea: rate the game, save the stats, study the pattern, and choose what to improve next.</p>
                <div className={styles.actions}>
                    <Link className={styles.button} to="/contact">Vote for a Sport</Link>
                    <Link className={`${styles.button} ${styles.secondary}`} to="/">Back to Soccer</Link>
                </div>
            </section>
            <section className={styles.sportsGrid} aria-label="Sports Veyro may support next">
                {[
                    { badge: "Private Beta", name: "Basketball", text: "Points, assists, rebounds, steals, blocks, turnovers, minutes, efficiency, and role-based game impact." },
                    { badge: "Coming Soon", name: "Football", text: "Position-specific ratings for quarterbacks, receivers, backs, defenders, linemen, and special teams." },
                    { badge: "Idea Stage", name: "Baseball", text: "Batting, pitching, fielding, baserunning, and simple post-game development notes." },
                    { badge: "Idea Stage", name: "Lacrosse", text: "Goals, assists, ground balls, saves, turnovers, faceoffs, defensive plays, and game impact." },
                ].map((s) => (
                    <article key={s.name} className={styles.sportCard}>
                        <span className={styles.badge}>{s.badge}</span>
                        <div><strong>{s.name}</strong><p>{s.text}</p></div>
                    </article>
                ))}
            </section>
            <section className={styles.panel}>
                <h2 className={styles.h2}>Which sport should come first?</h2>
                <p>Veyro should only add another sport if the rating system is actually useful for that sport. Vote by sending feedback, or tell us what stats should matter most.</p>
                <div className={styles.voteList}>
                    <Link to="/contact">Vote Basketball</Link>
                    <Link to="/contact">Vote Football</Link>
                    <Link to="/contact">Suggest Another Sport</Link>
                </div>
            </section>
        </main>
    );
}
