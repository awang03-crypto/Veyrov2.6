import { useEffect } from "react";
import { useMeta } from "../hooks/useMeta.js";
import { Link } from "react-router-dom";
import styles from "../styles/SeoPage.module.css";

export default function BasketballRatingSystem() {
    useEffect(() => {
        document.title = "Basketball Player Rating System | How to Rate Basketball Players | Veyro";
        const schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Basketball Player Rating System: How to Rate Players After Every Game",
            "description": "A complete guide to rating basketball players using per-minute stats, efficiency metrics, and position-adjusted formulas.",
            "author": { "@type": "Organization", "name": "Veyro" },
            "publisher": { "@type": "Organization", "name": "Veyro", "url": "https://darksalmon-lark-983637.hostingersite.com" },
            "datePublished": "2026-06-01",
            "dateModified": "2026-06-01",
            "mainEntityOfPage": { "@type": "WebPage", "@id": "https://darksalmon-lark-983637.hostingersite.com/basketball-rating-system" }
        };
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify(schema);
        document.head.appendChild(script);
        return () => document.head.removeChild(script);
    }, []);

    return (
        <main className={styles.seoPage}>
            <article>
                <section className={styles.hero}>
                    <div className={styles.eyebrow}>Basketball Analytics</div>
                    <h1 className={styles.h1}>How to build a basketball player rating system.</h1>
                    <p>Basketball is one of the most stat-rich sports at every level. Box scores capture points, rebounds, assists, steals, blocks, turnovers, and shooting percentages in every game. But raw box score stats without adjustment reward high-volume players and punish efficient players who play fewer minutes. A good basketball rating system fixes that by scaling everything to minutes played and weighting efficiency over volume.</p>
                    <div className={styles.actions}>
                        <Link className={styles.button} to="/basketball">Try Basketball Calculator</Link>
                        <Link className={styles.button} to="/basketball/vault">Basketball Vault</Link>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Why per-minute stats matter more than totals.</h2>
                    <p>A player who scores 18 points in 34 minutes is less efficient than a player who scores 14 points in 22 minutes. Per-minute scoring (points per 36 minutes, or points per minute) levels the comparison. The same logic applies to every counting stat: rebounds per minute, assists per minute, steals per minute. Total stats reward playing time; per-minute stats reward production.</p>
                    <p>The Veyro basketball rating formula scales all positive contributions by minutes played so that a player who comes off the bench for twelve explosive minutes is rated fairly against a starter who plays thirty-two steady minutes.</p>
                </section>

                <section className={styles.section}>
                    <h2>The key stats for a basketball rating.</h2>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>Points</strong><span>Weighted heavily. Scoring is the most direct contribution to winning. Goals come from good decisions and execution under pressure.</span></div>
                        <div className={styles.card}><strong>Assists</strong><span>Weighted significantly. Creating scoring opportunities for teammates is as valuable as scoring directly, especially for point guards.</span></div>
                        <div className={styles.card}><strong>Rebounds</strong><span>Weighted moderately. Offensive rebounds are slightly more valuable than defensive rebounds because they create extra possessions.</span></div>
                        <div className={styles.card}><strong>Steals and blocks</strong><span>Weighted well above their frequency. Defensive plays that create turnovers or end possessions have outsized impact on game outcome.</span></div>
                        <div className={styles.card}><strong>Turnovers</strong><span>A negative. Turnovers directly give the opponent possessions. A player with high scoring but high turnovers may be hurting the team overall.</span></div>
                        <div className={styles.card}><strong>Field goal efficiency</strong><span>The ratio of field goals made to attempted. A player shooting 8/12 contributes more efficiently than one shooting 8/20, even with the same points.</span></div>
                        <div className={styles.card}><strong>Plus/minus</strong><span>The team's scoring margin while the player is on the floor. A useful secondary signal that captures things the box score misses.</span></div>
                        <div className={styles.card}><strong>Minutes</strong><span>The denominator for all per-minute calculations. Essential input. A player who plays zero minutes has no rating.</span></div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>How the Veyro basketball formula works.</h2>
                    <p>The formula starts at a base score of 60 — representing a player who shows up and plays their role without major positive or negative contributions. From there, it adds scaled per-minute contributions for points, assists, rebounds, steals, and blocks, then subtracts for turnovers, and applies a secondary adjustment for field goal efficiency and plus/minus.</p>
                    <p>A player who scores 20 points in 28 minutes with 6 assists, 5 rebounds, 2 steals, and only 2 turnovers will land near 90-95 out of 100. A player who scores 8 points in 32 minutes with 8 turnovers and a -12 plus/minus may land below 50. The formula is intentionally calibrated so that genuinely elite performances produce scores above 90, and that the 60-80 range represents the reliable contribution that most good youth and amateur players produce.</p>
                </section>

                <section className={styles.section}>
                    <h2>Rating basketball players by position.</h2>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>Point guard</strong><span>Weight assists heavily. A PG who scores 12 but dishes 9 assists may rate higher than one who scores 18 with 3 assists. Turnovers are especially costly for ball handlers.</span></div>
                        <div className={styles.card}><strong>Shooting guard</strong><span>Weight scoring and field goal efficiency. SGs are expected to convert chances. An SG with high volume but low efficiency is hurting the team.</span></div>
                        <div className={styles.card}><strong>Small forward</strong><span>Balanced rating. SFs contribute across multiple categories. Look for players who contribute in at least three of: points, rebounds, assists, steals.</span></div>
                        <div className={styles.card}><strong>Power forward</strong><span>Weight rebounds and interior scoring. A PF who grabs 12 boards and scores 14 on 6/9 shooting is having an excellent game even without assists or steals.</span></div>
                        <div className={styles.card}><strong>Center</strong><span>Weight rebounds and blocks heavily. Centers who protect the rim and control the glass affect game outcome in ways that don't always show in traditional stats.</span></div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Tracking basketball performance over a season.</h2>
                    <p>Basketball seasons at youth and high school level typically run 20-30 games. That is enough data to produce meaningful trend analysis. By game ten, a player's average rating is reliable. By game twenty, you can identify consistent strengths and weaknesses clearly enough to build a targeted development plan for the off-season.</p>
                    <p>The most useful things to track over a season are: average rating, rating trend (rising, flat, or falling), consistency (how much the rating varies game to game), and how performance changes in higher-stakes games versus regular ones. Some players consistently perform better in big games — that is a valuable trait that raw stats alone won't reveal.</p>
                </section>

                <section className={styles.section}>
                    <h2>FAQ.</h2>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>Can I use this for youth basketball?</strong><span>Yes. The formula works at any level. For younger players, focus on fewer stats (points, rebounds, assists, turnovers) rather than all eight inputs.</span></div>
                        <div className={styles.card}><strong>How does Veyro compare to PER or Win Shares?</strong><span>Veyro is designed for simplicity and youth/amateur use. PER and Win Shares require play-by-play data. Veyro works from a basic box score entered in under five minutes.</span></div>
                        <div className={styles.card}><strong>What is a good rating for a high school player?</strong><span>For a starter on a competitive team, 70-80 is solid. Consistently above 85 is exceptional at high school level. Below 60 consistently suggests the player may need a different role.</span></div>
                        <div className={styles.card}><strong>Should I track three-point shooting separately?</strong><span>If the player takes more than four three-point attempts per game, yes. Otherwise, fold it into overall field goal efficiency. The impact is smaller at youth level than at college or pro.</span></div>
                        <div className={styles.card}><strong>How do I handle a player who specializes in defense?</strong><span>Weight steals, blocks, and plus/minus more heavily in your subjective assessment. The formula already rewards steals and blocks, but a lockdown defender who changes games without stats is genuinely hard to capture in any formula.</span></div>
                        <div className={styles.card}><strong>Can coaches use this for the whole team?</strong><span>Yes. Use the <Link to="/basketball">Veyro basketball calculator</Link> to rate each player after every game, then review the team view in the coach dashboard to spot who is developing fastest.</span></div>
                    </div>
                </section>
            </article>
        </main>
    );
}
