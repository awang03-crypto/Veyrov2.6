import { useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/SeoPage.module.css";
import { useMeta } from "../hooks/useMeta.js";

export default function SoccerPlayerStatsTracker() {
    useMeta("Soccer Player Stats Tracker | Veyro", "Track soccer player stats across every match. Build a performance history and spot trends over a full season.");

    return (
        <main className={styles.seoPage}>
            <section className={styles.hero}>
                <div className={styles.eyebrow}>Soccer Player Stats Tracker</div>
                <h1 className={styles.h1}>Track games, ratings, stats, and player growth.</h1>
                <p>Veyro helps players and coaches build a saved history of soccer performances. Every saved game can include rating, opponent, date, result, minutes played, position, full calculator inputs, and key stats for analysis.</p>
                <div className={styles.actions}>
                    <Link className={styles.button} to="/">Start Tracking</Link>
                    <Link className={styles.button} to="/soccer-performance-guide">Read Performance Guide</Link>
                    <Link className={styles.button} to="/analysis">View Analysis Tools</Link>
                </div>
            </section>
            <section className={styles.panel}>
                <h2>What stats can players track?</h2>
                <div className={styles.grid}>
                    <div className={styles.card}><strong>General player stats</strong><span>Touches, shots, shots on target, completed passes, missed passes, turnovers, duels, possession won, possession lost, fouls, cards, goals, and assists.</span></div>
                    <div className={styles.card}><strong>Goalkeeper stats</strong><span>Saves, goals conceded, clean sheets, cross claims, missed crosses, punches, dive catches, long balls, and penalty saves.</span></div>
                    <div className={styles.card}><strong>Performance analytics</strong><span>Average rating, best game, lowest game, recent form, strengths, weaknesses, per-90 numbers, and position-specific tips.</span></div>
                    <div className={styles.card}><strong>Coach team tracking</strong><span>Coaches can create team codes, invite players, view saved games, and compare team/player performance trends.</span></div>
                </div>
            </section>
            <section className={styles.panel}><h2>Why it helps youth soccer players.</h2><p>A soccer player stats tracker makes improvement easier to see. Instead of remembering only the final score, players can compare performances, find patterns, and focus on one clear area for the next game. The <Link to="/soccer-performance-guide">soccer performance guide</Link> explains a simple post-game routine players can use.</p></section>
            <section className={styles.panel}>
                <h2>Soccer stats tracker FAQ.</h2>
                <div className={styles.grid}>
                    <div className={styles.card}><strong>What soccer stats can I track?</strong><span>Track passing, shooting, duels, possession, fouls, cards, goals, assists, goalkeeper actions, minutes, results, and ratings.</span></div>
                    <div className={styles.card}><strong>Can coaches track a team?</strong><span>Yes. Coaches can create a team code, invite players, and review saved game data for their roster.</span></div>
                    <div className={styles.card}><strong>Does it show improvement?</strong><span>Saved ratings feed graphs, trends, strengths, weaknesses, comparisons, and per-90 style summaries.</span></div>
                    <div className={styles.card}><strong>Is it just for advanced players?</strong><span>No. The tracker is simple enough for youth players while still useful for coaches and serious player development.</span></div>
                </div>
            </section>
        </main>
    );
}
