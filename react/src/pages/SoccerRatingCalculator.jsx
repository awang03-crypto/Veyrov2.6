import { useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/SeoPage.module.css";
import { useMeta } from "../hooks/useMeta.js";

export default function SoccerRatingCalculator() {
    useMeta("Free Soccer Rating Calculator Guide | Veyro", "How to use the Veyro soccer match rating calculator. Position-specific formulas for goalkeeper, defender, midfielder, and attacker.");

    return (
        <main className={styles.seoPage}>
            <section className={styles.hero}>
                <div className={styles.eyebrow}>Soccer Match Rating Calculator</div>
                <h1 className={styles.h1}>Calculate a soccer player rating out of 100.</h1>
                <p>Veyro is a free soccer match rating calculator for players who want a clearer post-game snapshot. Choose a position, enter match stats, add decisive moments, and turn your performance into a live rating you can save and review.</p>
                <div className={styles.actions}>
                    <Link className={styles.button} to="/">Open Calculator</Link>
                    <Link className={styles.button} to="/soccer-performance-guide">Read Performance Guide</Link>
                    <Link className={styles.button} to="/about">Learn About Veyro</Link>
                </div>
            </section>
            <section className={styles.panel}><h2>Built for real soccer actions.</h2><p>The calculator tracks more than a final score. It looks at passes, shots, duels, possession wins, turnovers, fouls, cards, goals, assists, saves, clean sheets, and role-specific goalkeeper actions.</p>
                <div className={styles.grid}>
                    <div className={styles.card}><strong>Goalkeepers</strong><span>Saves, goals conceded, claims, punches, dive catches, long balls, clean sheets, and penalty saves.</span></div>
                    <div className={styles.card}><strong>Field Players</strong><span>Passes, shots, duels, possession changes, turnovers, goals, assists, fouls, and cards.</span></div>
                    <div className={styles.card}><strong>Saved History</strong><span>Store ratings with opponent, date, result, scoreline, minutes, and full calculator inputs.</span></div>
                </div>
            </section>
            <section className={styles.panel}><h2>Why use a match rating?</h2><p>A rating helps players reflect with more detail than &quot;good game&quot; or &quot;bad game.&quot; Veyro gives players a benchmark, then connects saved games to graphs, strengths, weaknesses, comparison, and coach team tools. For a full review process, read the <Link to="/soccer-performance-guide">soccer player performance guide</Link>.</p></section>
            <section className={styles.panel}>
                <h2>Soccer rating calculator FAQ.</h2>
                <div className={styles.grid}>
                    <div className={styles.card}><strong>What is a soccer match rating calculator?</strong><span>It turns match actions into a clear performance score so players can review more than the final score.</span></div>
                    <div className={styles.card}><strong>Which positions are supported?</strong><span>The calculator supports goalkeepers, defenders, midfielders, and attackers with different stat inputs for each role.</span></div>
                    <div className={styles.card}><strong>Can ratings be saved?</strong><span>Yes. Saved games can include opponent, date, result, scoreline, minutes, position, notes, and full calculator inputs.</span></div>
                    <div className={styles.card}><strong>Does it help youth players?</strong><span>Yes. It gives youth soccer players a simple way to track form, compare matches, and choose what to improve next.</span></div>
                </div>
            </section>
        </main>
    );
}
