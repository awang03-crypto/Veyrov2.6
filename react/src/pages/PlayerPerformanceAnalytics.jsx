import { useEffect } from "react";
import { useMeta } from "../hooks/useMeta.js";
import { Link } from "react-router-dom";
import styles from "../styles/SeoPage.module.css";

export default function PlayerPerformanceAnalytics() {
    useEffect(() => {
        document.title = "Soccer Player Performance Analytics | Veyro";
        const schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Soccer Player Performance Analytics: A Practical Guide for Players and Coaches",
            "description": "How to use performance analytics to track soccer player development, spot trends, and improve match by match.",
            "author": { "@type": "Organization", "name": "Veyro" },
            "publisher": { "@type": "Organization", "name": "Veyro", "url": "https://darksalmon-lark-983637.hostingersite.com" },
            "datePublished": "2026-06-01",
            "dateModified": "2026-06-01",
            "mainEntityOfPage": { "@type": "WebPage", "@id": "https://darksalmon-lark-983637.hostingersite.com/player-performance-analytics" }
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
                    <div className={styles.eyebrow}>Performance Analytics</div>
                    <h1 className={styles.h1}>Soccer player performance analytics for every level.</h1>
                    <p>Performance analytics used to be reserved for professional clubs with data science teams and six-figure tracking systems. That is no longer true. The same principles that Premier League clubs use to evaluate players — position-adjusted stats, trend analysis, consistency scores, and match context — can now be applied at the youth and amateur level with tools that take minutes to use.</p>
                    <div className={styles.actions}>
                        <Link className={styles.button} to="/">Start Tracking Free</Link>
                        <Link className={styles.button} to="/vault">View Match Vault</Link>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>What performance analytics actually measures.</h2>
                    <p>Performance analytics is not about collecting every stat. It is about collecting the right stats for a given position and context, then comparing them over time to identify patterns. A midfielder who averages 62% pass completion over ten matches is not "bad at passing" — they may be taking high-risk passes that a more conservative player would never attempt. Analytics provides the data; interpretation requires context.</p>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>Volume stats</strong><span>How much a player did. Passes attempted, duels entered, shots taken. Volume stats need to be scaled by minutes to be fair.</span></div>
                        <div className={styles.card}><strong>Efficiency stats</strong><span>How well a player did what they attempted. Pass completion rate, duel win rate, shot accuracy. These are the most meaningful stats for development.</span></div>
                        <div className={styles.card}><strong>Impact stats</strong><span>What happened as a result of the player's actions. Goals, assists, possession won in dangerous areas, decisive saves.</span></div>
                        <div className={styles.card}><strong>Error stats</strong><span>Costly mistakes that led directly to opponent chances or goals. These carry extra weight because their impact is disproportionate.</span></div>
                        <div className={styles.card}><strong>Consistency score</strong><span>How much a player's rating varies across matches. High variance may mean the player performs well only in easy games. Low variance means reliability.</span></div>
                        <div className={styles.card}><strong>Trend line</strong><span>Whether the player's ratings are rising, falling, or flat over a six-match window. Trend is the most important signal for player development.</span></div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>How to read a player's trend line.</h2>
                    <p>A single match rating tells you how a player performed on one day. A trend line tells you whether a player is developing. The most useful trend window for youth players is five to eight matches — long enough to filter out one-off performances, short enough to reflect recent form rather than a whole season average that has lost meaning.</p>
                    <p>A rising trend (ratings increasing from match to match) is the most important positive signal in youth player development. It means the training is working, the player is applying feedback, and their baseline is improving. A flat trend with high ratings means a reliably strong player. A flat trend with average ratings means a player who has plateaued and needs a new challenge. A falling trend needs immediate attention — it may mean fatigue, injury, a tactical mismatch, or a personal issue the coach is not aware of.</p>
                </section>

                <section className={styles.section}>
                    <h2>Position-adjusted ratings explained.</h2>
                    <p>Raw stats without position adjustment are misleading. A goalkeeper who makes zero saves in a match might be playing perfectly. A striker who scores zero goals might have created three high-quality chances that teammates missed. Position-adjusted ratings account for what each position is responsible for and weight the stats accordingly.</p>
                    <p>The Veyro formula uses a position-specific base score — 62 for goalkeepers, 64 for defenders, 66 for midfielders, 65 for attackers — and then applies different weights to positive and negative stats depending on position. A midfielder's turnovers reduce the rating less than an attacker's turnovers because midfielders attempt more passes in tighter areas. A goalkeeper's clean sheet adds more to the final score than a defender's, because goalkeepers have more direct control over that outcome.</p>
                </section>

                <section className={styles.section}>
                    <h2>Building a match analysis habit.</h2>
                    <ol className={styles.checklist}>
                        <li>Record match stats within two hours of the final whistle. Memory degrades quickly after intense competition.</li>
                        <li>Enter position, minutes, and the six to eight core stats for your role. This should take under five minutes.</li>
                        <li>Add a brief note — one sentence — about the match context. Opponent level, your own physical state, any unusual conditions.</li>
                        <li>Save the rating and review your trend line. Is it higher or lower than your last three matches?</li>
                        <li>Identify one thing that worked and one thing to improve. Write it down, not just think it.</li>
                        <li>After five saved matches, review the pattern. Which stats are consistently strong? Which are consistently weak?</li>
                        <li>Share your trend with your coach before a training session where you want specific feedback.</li>
                    </ol>
                </section>

                <section className={styles.section}>
                    <h2>Analytics for basketball and football.</h2>
                    <p>The same principles apply across sports. Veyro's basketball rating formula uses per-minute production weighted for points, assists, rebounds, steals, blocks, and turnovers. The football formula uses position-specific weights for QBs (passing yards, touchdowns, interceptions), running backs (rushing yards and touchdowns), and defensive players (tackles, sacks, forced fumbles).</p>
                    <p>Cross-sport tracking is useful for multi-sport athletes who want to understand whether their athletic development is transferring between sports, or who need to make a decision about sport specialization based on data rather than gut feeling.</p>
                </section>

                <section className={styles.section}>
                    <h2>FAQ.</h2>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>Do I need to track every stat?</strong><span>No. Track the six to eight most important stats for your position consistently. Incomplete consistent data is more useful than complete inconsistent data.</span></div>
                        <div className={styles.card}><strong>How many matches before the data is meaningful?</strong><span>Five matches is the minimum for a useful trend. Ten or more matches is where patterns become genuinely reliable.</span></div>
                        <div className={styles.card}><strong>Should I share my stats with college coaches?</strong><span>Yes, if you are at the recruiting stage. A clean statistical record of consistent performance is more compelling than a highlight reel alone.</span></div>
                        <div className={styles.card}><strong>What does a good rating look like for a youth player?</strong><span>For most youth players, a consistent average of 70–80 is strong. Above 85 consistently is exceptional. Below 60 consistently signals something that needs addressing.</span></div>
                        <div className={styles.card}><strong>Can analytics replace coaching?</strong><span>No. Analytics gives coaches and players better information. The interpretation, the training design, and the player relationship still require a human coach.</span></div>
                        <div className={styles.card}><strong>Is this useful for recreational players?</strong><span>Yes. Recreational players benefit from the same habit of reflection. Even a casual player who tracks five matches a season develops more self-awareness than one who never reviews performance.</span></div>
                    </div>
                </section>
            </article>
        </main>
    );
}
