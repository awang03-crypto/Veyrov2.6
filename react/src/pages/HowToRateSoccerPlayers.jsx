import { useEffect } from "react";
import { useMeta } from "../hooks/useMeta.js";
import { Link } from "react-router-dom";
import styles from "../styles/SeoPage.module.css";

export default function HowToRateSoccerPlayers() {
    useEffect(() => {
        document.title = "How to Rate Soccer Players | Veyro";
        // JSON-LD schema
        const schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "How to Rate Soccer Players After Every Match",
            "description": "A complete guide to rating soccer players using stats, position, and match context. Covers all positions from goalkeeper to attacker.",
            "author": { "@type": "Organization", "name": "Veyro" },
            "publisher": { "@type": "Organization", "name": "Veyro", "url": "https://darksalmon-lark-983637.hostingersite.com" },
            "datePublished": "2026-06-01",
            "dateModified": "2026-06-01",
            "mainEntityOfPage": { "@type": "WebPage", "@id": "https://darksalmon-lark-983637.hostingersite.com/how-to-rate-soccer-players" }
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
                    <div className={styles.eyebrow}>Rating Guide</div>
                    <h1 className={styles.h1}>How to rate soccer players after every match.</h1>
                    <p>Rating a soccer player after a match is harder than it looks. Goals and assists tell part of the story. But a central midfielder who wins twelve duels, completes forty-three passes, and prevents two dangerous attacks may deserve a higher rating than a striker who scored once and went missing for seventy minutes. This guide explains how to build a fair, consistent rating system for any position.</p>
                    <div className={styles.actions}>
                        <Link className={styles.button} to="/">Try the Free Calculator</Link>
                        <Link className={styles.button} to="/soccer-performance-guide">Full Performance Guide</Link>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Why a rating system matters.</h2>
                    <p>Without a system, player ratings are just opinions. Two coaches watching the same match often land on completely different assessments because they are watching different things. A structured rating system creates a shared language between coaches, players, and parents. It shifts conversations from "you played badly" to "your duels won dropped from eight to three — here is why that matters."</p>
                    <p>A good rating system does three things: it rewards what each position is actually responsible for, it accounts for match context so a player is never judged unfairly for a tough opponent or a short substitution, and it produces a number that is consistent enough to track over time.</p>
                </section>

                <section className={styles.section}>
                    <h2>The core inputs for any rating.</h2>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>Position</strong><span>A goalkeeper's rating should weight saves and clean sheets heavily. A striker's rating should weight goals and key passes. The formula changes completely by position.</span></div>
                        <div className={styles.card}><strong>Minutes played</strong><span>A player who comes on for fifteen minutes cannot be compared directly to a player who plays ninety. Scale all volume stats by minutes to get a fair comparison.</span></div>
                        <div className={styles.card}><strong>Match context</strong><span>Opponent strength, weather, pitch condition, and whether the team won or lost all affect how individual stats should be read.</span></div>
                        <div className={styles.card}><strong>Positive actions</strong><span>Goals, assists, key passes, duels won, successful dribbles, shots on target, saves, clean sheets, and passes completed all contribute positively.</span></div>
                        <div className={styles.card}><strong>Negative actions</strong><span>Turnovers, fouls, yellow cards, red cards, shots missed, goals conceded, and costly errors reduce the rating.</span></div>
                        <div className={styles.card}><strong>Decisive moments</strong><span>A goal that wins the match, a penalty saved, or a last-minute tackle should carry more weight than the same action in a comfortable win.</span></div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>How to rate a goalkeeper.</h2>
                    <p>Goalkeepers are the hardest position to rate fairly because their impact is often invisible. A goalkeeper who makes zero saves in a 3-0 win may have played perfectly, distributing well, commanding their area, and organizing the defense. A goalkeeper who makes eight saves in a 1-0 loss may have been the reason the team was still in the match.</p>
                    <p>The most important stats for a goalkeeper rating are saves made, goals conceded, clean sheet (yes or no), high balls claimed, distribution accuracy, and whether any goals conceded were the result of a goalkeeper error. A base score for a goalkeeper starts at around 62 out of 100, adjusting upward for saves and clean sheets and downward for goals conceded and errors.</p>
                </section>

                <section className={styles.section}>
                    <h2>How to rate a defender.</h2>
                    <p>Defenders are judged on whether the team kept a clean sheet, how many duels they won, how few dangerous mistakes they made, and how well they distributed the ball under pressure. A center-back who wins seven of eight aerial duels, makes two key blocks, and completes eighty percent of their passes is having an excellent match even if the scoreline does not show it.</p>
                    <p>Defensive rating inputs: duels won, possession won, clearances, blocks, interceptions, fouls committed, yellow or red cards, and turnovers in dangerous areas. A base score of 64 is reasonable for a defender, moving upward for clean sheets and high duel win rates, downward for fouls and costly errors.</p>
                </section>

                <section className={styles.section}>
                    <h2>How to rate a midfielder.</h2>
                    <p>Midfielders are the engine of the team and the hardest to rate with simple stats. The best midfielders do things that do not appear in a basic stats sheet: they press intelligently, they recycle possession under pressure, they cover space that no one notices until it goes wrong. For rating purposes, focus on passes completed, duels won, possession won, shots, key passes, assists, and turnovers.</p>
                    <p>A central midfielder base score starts around 66. A box-to-box midfielder who completes forty-five passes, wins six duels, and contributes one key pass is having a strong match. An attacking midfielder is weighted more toward chances created and goals, while a defensive midfielder is weighted more toward possession won and duels.</p>
                </section>

                <section className={styles.section}>
                    <h2>How to rate an attacker.</h2>
                    <p>Attackers are the most straightforward position to rate because goals and assists are visible and unambiguous. But an attacker who plays well without scoring — pressing defenders into mistakes, creating three chances that teammates miss — deserves credit for that work too. The best attacker ratings combine goals, assists, shots on target, key passes, successful dribbles, and the attacker's overall involvement in dangerous play.</p>
                    <p>A base score of 65 for attackers moves sharply upward for goals (especially decisive ones) and downward for a long run of shots missed or no involvement in attacking play.</p>
                </section>

                <section className={styles.section}>
                    <h2>A simple rating scale to use.</h2>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>90–100</strong><span>Exceptional. Match-winning performance. Top-of-position stats with no costly errors.</span></div>
                        <div className={styles.card}><strong>80–89</strong><span>Very good. Clearly above average for the position. Strong contribution in most key areas.</span></div>
                        <div className={styles.card}><strong>70–79</strong><span>Good. Solid performance with some standout moments. A reliable showing.</span></div>
                        <div className={styles.card}><strong>60–69</strong><span>Average. Did the basics but limited impact. Expected level for the game.</span></div>
                        <div className={styles.card}><strong>50–59</strong><span>Below average. Struggled in key areas. Stats were below position expectations.</span></div>
                        <div className={styles.card}><strong>Below 50</strong><span>Poor. Costly errors, very low contribution, or early red card.</span></div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>How Veyro calculates ratings automatically.</h2>
                    <p>The <Link to="/">Veyro soccer rating calculator</Link> uses a position-based formula that weights each stat by its importance for that position. You enter the player's position, minutes played, and the key stats for the match. The calculator handles the math and returns a rating out of 100. You can then save the result to the <Link to="/vault">match vault</Link> to track performance over time.</p>
                    <p>The formula starts with a position-specific base score, adds scaled positive contributions (weighted by minutes played), and subtracts for turnovers, fouls, and decisive errors. The result is clamped between 1 and 100 so no single match can produce an impossible score.</p>
                </section>

                <section className={styles.section}>
                    <h2>FAQ.</h2>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>Can I rate any position?</strong><span>Yes. Veyro supports goalkeeper, defender, midfielder, and attacker ratings, each with a different formula that weights the stats that matter most for that role.</span></div>
                        <div className={styles.card}><strong>Should I rate players after every game?</strong><span>Yes. One game gives a snapshot, but five or more games reveal patterns. A single high or low rating can be misleading without context.</span></div>
                        <div className={styles.card}><strong>How do I handle a player who played two positions?</strong><span>Rate using the position the player spent the most minutes in. Note the position change in the match notes.</span></div>
                        <div className={styles.card}><strong>What if I don't have all the stats?</strong><span>Use the stats you have. A rating based on partial stats is still more useful than no rating at all. Focus on the most important stats for the position.</span></div>
                        <div className={styles.card}><strong>Is a higher rating always better?</strong><span>In context, yes. But a 74 from a goalkeeper under heavy pressure against a strong team may be more impressive than an 82 from an attacker who scored one tap-in against weak opposition.</span></div>
                        <div className={styles.card}><strong>How do youth players benefit from ratings?</strong><span>Ratings give youth players a concrete number to work toward, a way to track improvement, and a starting point for self-reflection without relying only on coach feedback.</span></div>
                    </div>
                </section>
            </article>
        </main>
    );
}
