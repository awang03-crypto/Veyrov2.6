import { useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/SeoPage.module.css";
import { useMeta } from "../hooks/useMeta.js";

export default function SoccerPerformanceGuide() {
    useMeta("How to Track Soccer Performance | Veyro Guide", "A complete guide to tracking soccer player performance after every match. Covers stats, ratings, and post-game review routines.");

    return (
        <main className={styles.seoPage}>
            <article>
                <section className={styles.hero}>
                    <div className={styles.eyebrow}>Player Development Guide</div>
                    <h1 className={styles.h1}>How to track soccer performance after every match.</h1>
                    <p>This guide is for youth soccer players, parents, and coaches who want a clear way to review games. The goal is not to turn soccer into homework. The goal is to make improvement easier to see after every match.</p>
                    <div className={styles.actions}>
                        <Link className={styles.button} to="/">Try the Calculator</Link>
                        <Link className={styles.button} to="/soccer-rating-calculator">Rating Calculator Guide</Link>
                    </div>
                </section>

                <section className={styles.section}><h2>Start with match context.</h2><p>Before looking at stats, write down the basic match context. A rating means more when it includes opponent, date, position, minutes played, result, scoreline, and whether the player was returning from injury, playing a new role, or facing a stronger team.</p><p>Two players can both earn a 76 rating, but the story may be very different. A midfielder who played 80 minutes against a strong opponent may deserve a different review than a winger who played 25 minutes in an easier game. Context keeps the data fair.</p></section>

                <section className={styles.section}>
                    <h2>The most useful soccer stats to track.</h2>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>Passing</strong><span>Completed passes, missed passes, progressive passes, long balls, and simple turnovers.</span></div>
                        <div className={styles.card}><strong>Attacking</strong><span>Shots, shots on target, goals, assists, key passes, chances created, and successful dribbles.</span></div>
                        <div className={styles.card}><strong>Defending</strong><span>Duels won, possession won, tackles, interceptions, fouls, cards, and dangerous mistakes.</span></div>
                        <div className={styles.card}><strong>Goalkeeping</strong><span>Saves, goals conceded, clean sheets, claims, punches, dive catches, and penalty saves.</span></div>
                        <div className={styles.card}><strong>Reliability</strong><span>Minutes played, consistency, decisions under pressure, and how often the player avoids costly errors.</span></div>
                        <div className={styles.card}><strong>Impact</strong><span>Goals, assists, saves, clean sheets, late-game actions, and moments that change the match.</span></div>
                    </div>
                </section>

                <section className={styles.section}><h2>Use a rating as the summary, not the whole story.</h2><p>A match rating is useful because it gives players one simple number to remember. But the best review comes from pairing the rating with the stats behind it. If a defender receives a lower rating, the player should be able to see whether the issue was turnovers, fouls, duels lost, or a decisive error.</p><p>Veyro is built around that idea. The <Link to="/soccer-rating-calculator">soccer match rating calculator</Link> gives the quick score, while saved games in the <Link to="/soccer-player-stats-tracker">soccer player stats tracker</Link> show the pattern over time.</p></section>

                <section className={styles.section}>
                    <h2>A simple post-game review routine.</h2>
                    <ol className={styles.checklist}>
                        <li>Record opponent, position, minutes, result, and scoreline.</li>
                        <li>Enter the main stats for the player&apos;s position.</li>
                        <li>Save the rating and any match notes while the game is still fresh.</li>
                        <li>Pick one strength from the game.</li>
                        <li>Pick one improvement focus for the next game.</li>
                        <li>After five saved games, review trends instead of judging one match by itself.</li>
                    </ol>
                </section>

                <section className={styles.section}><h2>What coaches can do with player tracking.</h2><p>Coaches do not need every player to track every advanced stat. A simple system works better when players actually use it. Coaches can ask players to save ratings after matches, then use trends to guide individual feedback, team conversations, and development goals.</p><p>The <Link to="/for-coaches">Veyro coach tools</Link> are made for this workflow: players save their own games, coaches review team activity, and everyone gets a clearer picture of progress.</p></section>

                <section className={styles.section}>
                    <h2>FAQ.</h2>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>What stats should youth players track?</strong><span>Start with minutes, position, passes, shots, duels, possession won, turnovers, goals, assists, saves, and result.</span></div>
                        <div className={styles.card}><strong>Should players track stats after every game?</strong><span>Yes, if the process is quick. A five-minute review after each match builds better habits than a long review once a month.</span></div>
                        <div className={styles.card}><strong>Is one game enough?</strong><span>One game gives a snapshot, but real improvement becomes visible after five or more saved games show patterns.</span></div>
                    </div>
                </section>
            </article>
        </main>
    );
}
