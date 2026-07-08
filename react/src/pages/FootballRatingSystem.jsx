import { useEffect } from "react";
import { useMeta } from "../hooks/useMeta.js";
import { Link } from "react-router-dom";
import styles from "../styles/SeoPage.module.css";

export default function FootballRatingSystem() {
    useEffect(() => {
        document.title = "Football Player Rating System | How to Rate Football Players | Veyro";
        const schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Football Player Rating System: How to Rate Players After Every Game",
            "description": "A complete guide to rating football players by position — QB, RB, WR, TE, OL, DL, LB, DB — using stat-based formulas.",
            "author": { "@type": "Organization", "name": "Veyro" },
            "publisher": { "@type": "Organization", "name": "Veyro", "url": "https://darksalmon-lark-983637.hostingersite.com" },
            "datePublished": "2026-06-01",
            "dateModified": "2026-06-01",
            "mainEntityOfPage": { "@type": "WebPage", "@id": "https://darksalmon-lark-983637.hostingersite.com/football-rating-system" }
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
                    <div className={styles.eyebrow}>Football Analytics</div>
                    <h1 className={styles.h1}>How to rate football players after every game.</h1>
                    <p>Rating football players is more position-specific than almost any other sport. A quarterback's game is almost entirely about passing efficiency. An offensive lineman's game may produce zero stats in a traditional box score while being the most important player on the field. A safety's game is invisible until something goes wrong. Building a fair rating system means building a different formula for every position.</p>
                    <div className={styles.actions}>
                        <Link className={styles.button} to="/football">Try Football Calculator</Link>
                        <Link className={styles.button} to="/football/vault">Football Vault</Link>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Rating quarterbacks.</h2>
                    <p>The quarterback is the most analyzed position in American sports. Passing yards, touchdowns, interceptions, completion percentage, and yards per attempt are the foundation. But passer rating formulas have existed since the 1970s and they all agree on one thing: touchdowns and interceptions carry more weight than yardage because they directly determine scoring and possession.</p>
                    <p>The Veyro QB formula starts at a base of 66 and adds for passing yards per snap, touchdowns, and completions, then heavily subtracts for interceptions. A QB who throws for 280 yards, 2 touchdowns, and 0 interceptions on 60 snaps will rate well above 80. A QB who throws for 320 yards but with 3 interceptions may rate below 70 despite the impressive yardage.</p>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>Passing yards</strong><span>Weighted by snaps played. A QB who produces 5 yards per snap is performing above average.</span></div>
                        <div className={styles.card}><strong>Touchdowns</strong><span>High weight. Each TD adds significantly to the rating. Touchdowns win games.</span></div>
                        <div className={styles.card}><strong>Interceptions</strong><span>High negative weight. Each interception subtracts significantly more than a touchdown adds.</span></div>
                        <div className={styles.card}><strong>Completions</strong><span>Moderate weight. Completion rate is a proxy for decision making and accuracy under pressure.</span></div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Rating running backs.</h2>
                    <p>Running backs are rated on rushing yards per snap and rushing touchdowns, with secondary credit for receptions and receiving yards when they are used as pass catchers. A RB who carries the ball 18 times for 112 yards and a touchdown is having a strong game. A RB who carries the ball 22 times for 64 yards and fumbles once is having a poor game regardless of the volume.</p>
                    <p>Fumbles are the most damaging stat for a running back rating because they directly transfer possession. A single fumble can lower a rating by 10-15 points depending on the overall performance level.</p>
                </section>

                <section className={styles.section}>
                    <h2>Rating wide receivers and tight ends.</h2>
                    <p>WRs and TEs are rated on receiving yards per snap, receptions, and receiving touchdowns. The formula accounts for the fact that receivers are dependent on quarterback decisions and offensive play-calling — a receiver who runs perfect routes but receives no targets should not be rated poorly for their work.</p>
                    <p>The most useful secondary stat for receivers is separation — how far they get from coverage on their routes. This is not always available at youth and amateur level, but when it is, it tells the full story of a receiver's performance regardless of targets.</p>
                </section>

                <section className={styles.section}>
                    <h2>Rating defensive players.</h2>
                    <p>Defense is the hardest side of football to rate because most defensive impact is invisible until it goes wrong. A linebacker who makes perfect reads and forces the offense into an incompletion on third down will not appear in the box score. The stats that do appear — tackles, sacks, forced fumbles, interceptions, and defensive touchdowns — heavily favor defensive linemen and linebackers over safeties and corners who may be doing excellent work in coverage without touches.</p>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>Defensive linemen</strong><span>Rate on tackles, sacks, and pressures. A DL with 2 sacks and 4 tackles is having an excellent game. Forced fumbles add significantly.</span></div>
                        <div className={styles.card}><strong>Linebackers</strong><span>Rate on tackles first, then sacks, forced fumbles, and interceptions. LBs are expected to produce tackles consistently.</span></div>
                        <div className={styles.card}><strong>Defensive backs</strong><span>Rate on interceptions, pass breakups, and tackles in run support. Coverage quality is genuinely hard to capture in basic stats.</span></div>
                        <div className={styles.card}><strong>Defensive touchdowns</strong><span>The highest-value defensive play. A pick-six or fumble return for a touchdown adds maximum points to the rating.</span></div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Position base scores in the Veyro formula.</h2>
                    <p>The Veyro football rating formula uses position-specific base scores that reflect the typical difficulty and visibility of each role. Quarterbacks start at 66 because their performance is highly visible and directly measurable. Offensive linemen start at 63 because their contribution is real but harder to quantify. Kickers start at 62 because their opportunities are infrequent and results binary.</p>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>QB: 66</strong><span>High visibility, high accountability, high impact on game outcome.</span></div>
                        <div className={styles.card}><strong>WR: 65</strong><span>Production depends partly on QB decisions, but route running and catch quality are player-controlled.</span></div>
                        <div className={styles.card}><strong>RB: 64</strong><span>Direct production through carries and catches. More controllable than WR.</span></div>
                        <div className={styles.card}><strong>TE: 64</strong><span>Hybrid role between blocker and receiver. Blocking contribution is hard to capture.</span></div>
                        <div className={styles.card}><strong>LB / DB: 64</strong><span>Tackling and coverage contributions weighted appropriately.</span></div>
                        <div className={styles.card}><strong>OL / DL: 63</strong><span>Trench play has enormous impact but limited statistical capture.</span></div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>FAQ.</h2>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>Can I use this for flag football?</strong><span>Yes. The same positions and stats apply. The key difference is that sacks and physical tackling stats will not appear, but passing, rushing, and receiving stats work identically.</span></div>
                        <div className={styles.card}><strong>How do I rate an offensive lineman with no stats?</strong><span>Use the snap count as the primary input and note penalties and sacks allowed in the match notes. Until the formula has a penalties-allowed input, OL ratings will be approximate.</span></div>
                        <div className={styles.card}><strong>What is a good rating for a high school QB?</strong><span>Consistently above 75 is solid for a varsity QB. Above 85 is excellent. A QB averaging below 65 may be in the wrong system or facing a difficulty spike they need support with.</span></div>
                        <div className={styles.card}><strong>How do I handle a two-way player?</strong><span>Enter two separate ratings — one for each position — and average them if you want a single number. Tracking both gives a clearer picture of where the player contributes most.</span></div>
                        <div className={styles.card}><strong>Should I rate special teams?</strong><span>Yes if the player has meaningful special teams snaps. Kicker accuracy (field goals made vs attempted) and punting average are straightforward to track. Return touchdowns are high-impact plays worth rating separately.</span></div>
                        <div className={styles.card}><strong>Can coaches use this for the whole team?</strong><span>Yes. Use the <Link to="/football">Veyro football calculator</Link> to rate each player after every game, then review team trends in the coach dashboard.</span></div>
                    </div>
                </section>
            </article>
        </main>
    );
}
