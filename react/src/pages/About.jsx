import { useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/About.module.css";
import { useMeta } from "../hooks/useMeta.js";

export default function About() {
    useMeta("About Veyro | Soccer Player Rating App", "Learn about Veyro — the free soccer, basketball, and football player match rating calculator built for youth players and coaches.");

    return (
        <main className={`page ${styles.aboutPage}`}>
            <section className={`${styles.hero} ${styles.glass}`}>
                <div>
                    <div className={styles.eyebrow}>About Veyro</div>
                    <h1 className={styles.h1}>Turn every game into a better next game.</h1>
                    <p className={styles.heroCopy}>Veyro is built for players who want more than a final score. It turns match stats, decisive moments, and position-specific actions into a clear performance snapshot you can save, compare, and learn from.</p>
                    <div className={styles.heroActions}>
                        <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/">Start Calculating</Link>
                        <Link className={`${styles.btn} ${styles.btnSecondary}`} to="/analysis">View Analysis</Link>
                    </div>
                </div>
                <aside className={styles.scoreCard} aria-label="Veyro preview">
                    <div>
                        <div className={styles.scoreLabel}>Player Improvement Loop</div>
                        <div className={styles.scoreNumber}>Rate<span>.</span></div>
                        <div className={styles.scoreNumber}>Save<span>.</span></div>
                        <div className={styles.scoreNumber}>Grow<span>.</span></div>
                    </div>
                    <div className={styles.miniGrid}>
                        <div className={styles.miniStat}><strong>100</strong><span>Rating Scale</span></div>
                        <div className={styles.miniStat}><strong>4</strong><span>Positions</span></div>
                        <div className={styles.miniStat}><strong>Live</strong><span>Calculator</span></div>
                        <div className={styles.miniStat}><strong>Vault</strong><span>Saved Games</span></div>
                    </div>
                </aside>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHead}>
                    <h2>What The App Does</h2>
                    <p>It connects the whole post-match routine: enter stats, see the rating, save the match, then use your history to spot patterns.</p>
                </div>
                <div className={styles.featureGrid}>
                    {[
                        { num: "01", title: "Live Rating", text: "Your score updates as you enter match actions, so you can understand the impact before saving anything." },
                        { num: "02", title: "Private Vault", text: "Saved games stay tied to your account with opponent, date, position, rating, and the stats behind the score." },
                        { num: "03", title: "Performance Graph", text: "Your rating history becomes a simple trend line, making it easier to see form over time." },
                        { num: "04", title: "Player Analysis", text: "Strengths, weaknesses, best games, recent trends, and age comparisons help turn data into action." },
                    ].map((f) => (
                        <article key={f.num} className={styles.featureCard}>
                            <div className={styles.icon}>{f.num}</div>
                            <h3>{f.title}</h3>
                            <p>{f.text}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHead}>
                    <h2>How It Works</h2>
                    <p>A match review should be fast enough to finish after the game, but detailed enough to actually teach you something.</p>
                </div>
                <div className={styles.flow}>
                    <article className={styles.flowCard} data-step="1"><h3>Choose Your Role</h3><p>Your saved signup position controls the calculator, so the rating stays focused on what matters for your role.</p></article>
                    <article className={styles.flowCard} data-step="2"><h3>Enter The Match</h3><p>Add the important actions from the game: passes, shots, duels, turnovers, saves, goals, assists, and more.</p></article>
                    <article className={styles.flowCard} data-step="3"><h3>Benchmark Progress</h3><p>Save the match to compare it with your past performances and with players around your age.</p></article>
                </div>
            </section>

            <section className={`${styles.section} ${styles.positionBand}`}>
                <div className={styles.positionGrid}>
                    <article className={styles.positionCard}><h3>Goalkeepers</h3><p>Track saves, claims, punches, keeper-sweeper actions, clean sheets, and goals conceded.</p></article>
                    <article className={styles.positionCard}><h3>Defenders</h3><p>Focus on duels, defensive control, errors, possession wins, passing, and team protection.</p></article>
                    <article className={styles.positionCard}><h3>Midfielders</h3><p>Balance passing volume, chance creation, turnovers, duels, possession, and influence.</p></article>
                    <article className={styles.positionCard}><h3>Attackers</h3><p>Measure goals, assists, shots, chance quality, missed chances, pressure moments, and impact.</p></article>
                </div>
            </section>

            <section className={`${styles.section} ${styles.quoteCard}`}>
                <div>
                    <h2>Data. Benchmark. Improve.</h2>
                    <p>The goal is not to judge one game forever. The goal is to build a clearer picture of how you play, what you repeat, and what one thing you can improve before the next match.</p>
                </div>
                <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/vault">Open Vault</Link>
            </section>
        </main>
    );
}
