import { useEffect } from "react";
import { useMeta } from "../hooks/useMeta.js";
import { Link } from "react-router-dom";
import styles from "../styles/SeoPage.module.css";

export default function YouthCoachPlaybook() {
    useEffect(() => {
        document.title = "Youth Soccer Coach Playbook | Player Development | Veyro";
        const schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Youth Soccer Coach Playbook: Player Development from First Practice to Match Day",
            "description": "A complete playbook for youth soccer coaches covering player development, match analysis, rating systems, and team management tools.",
            "author": { "@type": "Organization", "name": "Veyro" },
            "publisher": { "@type": "Organization", "name": "Veyro", "url": "https://darksalmon-lark-983637.hostingersite.com" },
            "datePublished": "2026-06-01",
            "dateModified": "2026-06-01",
            "mainEntityOfPage": { "@type": "WebPage", "@id": "https://darksalmon-lark-983637.hostingersite.com/youth-coach-playbook" }
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
                    <div className={styles.eyebrow}>Coach Playbook</div>
                    <h1 className={styles.h1}>The youth soccer coach playbook.</h1>
                    <p>Youth soccer coaching is one of the most demanding volunteer jobs in youth sports. You are responsible for player development, parent communication, team management, match preparation, and player welfare — often with no staff, limited training time, and pressure from every direction. This playbook covers the systems, habits, and tools that make the job manageable and the results better.</p>
                    <div className={styles.actions}>
                        <Link className={styles.button} to="/onboarding">Set Up Your Team</Link>
                        <Link className={styles.button} to="/for-coaches">Veyro for Coaches</Link>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Building a player development system.</h2>
                    <p>The coaches who develop players fastest are not necessarily the most tactical. They are the most consistent. They show up with a plan, they track what is working, and they give individual feedback that is specific enough to act on. A player who hears "you need to work on your passing" every week learns nothing. A player who hears "your pass completion on your left foot dropped from 68% to 51% this month — let's focus on that in training" has something concrete to work toward.</p>
                    <p>The foundation of a player development system is match data. Without data, coach feedback is always opinion. With data, feedback becomes conversation. The player can agree or disagree, ask questions, and take ownership of their own improvement. That shift — from coach telling to player owning — is the single biggest difference between youth players who develop and those who plateau.</p>
                    <h3 style={{ color: "var(--green-1)", fontFamily: "var(--display)", marginTop: 20 }}>The four pillars of youth player development:</h3>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>1. Consistent data</strong><span>Track the same stats after every match so comparisons are valid. Five matches of consistent data reveal more than twenty matches of inconsistent notes.</span></div>
                        <div className={styles.card}><strong>2. Position-specific feedback</strong><span>A goalkeeper and a striker need completely different feedback. Position-specific ratings and stats keep feedback relevant.</span></div>
                        <div className={styles.card}><strong>3. Trend awareness</strong><span>One bad match means nothing. Three bad matches in a row might mean something. Track trends, not moments.</span></div>
                        <div className={styles.card}><strong>4. Player ownership</strong><span>Players who track their own stats develop faster than players who wait for coach feedback. Build the habit early.</span></div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Match day preparation for coaches.</h2>
                    <p>Match day is not the time for major tactical changes. The week of training is where coaching happens. Match day is execution. The best youth coaches show up on match day with a simple game plan, clear player roles, and a calm presence that transfers to the team.</p>
                    <ol className={styles.checklist}>
                        <li>Confirm the lineup and formation by the day before the match. Last-minute changes create anxiety in youth players.</li>
                        <li>Give each player one individual focus for the match — not tactics, but something personal to their development.</li>
                        <li>Keep the pre-match team talk short. Under five minutes. Players are nervous; long speeches increase anxiety.</li>
                        <li>During the match, take quick notes on paper or phone. Stats are hard to remember accurately after the final whistle.</li>
                        <li>After the match, give a brief team debrief that focuses on effort and intent, not result.</li>
                        <li>Within 24 hours, enter match stats into your tracking system while they are still fresh.</li>
                    </ol>
                </section>

                <section className={styles.section}>
                    <h2>What stats to track at youth level.</h2>
                    <p>The temptation is to track everything. Resist it. A tracking system that takes forty-five minutes per player per match will not survive the season. The best youth tracking systems focus on eight to twelve stats per player, collected in under ten minutes, that are honest enough to be useful and simple enough to be sustainable.</p>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>For all positions</strong><span>Minutes played, match result, opponent, and overall rating. These four entries create a complete season record with minimal effort.</span></div>
                        <div className={styles.card}><strong>Outfield players</strong><span>Passes completed, duels won, turnovers, shots, goals, and assists. Six stats that cover the major contributions and errors for any outfield position.</span></div>
                        <div className={styles.card}><strong>Goalkeepers</strong><span>Saves, goals conceded, clean sheet, and high claims. Four stats that define a goalkeeper's performance in most youth matches.</span></div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Managing parents — the hardest part of coaching.</h2>
                    <p>Every experienced youth coach will tell you the same thing: the players are the easy part. Parents are where coaching becomes genuinely difficult. A parent who disagrees with playing time, questions tactical decisions from the sideline, or undermines confidence after a tough match can undo months of development work in a single car ride home.</p>
                    <p>The most effective tool against parent conflict is transparency. When parents can see that playing time decisions are based on something more than opinion — that their child's development is being tracked, that the coach has a plan, that the system is consistent — most concerns dissolve before they become arguments. This is where a tracking system like Veyro helps beyond just the coaching function. It creates a paper trail of player development that parents can understand.</p>
                    <ol className={styles.checklist}>
                        <li>Set expectations with parents at the season's first meeting. Explain your development philosophy, your communication policy, and your tracking system.</li>
                        <li>Share aggregate stats with parents monthly, not after every match. Weekly sharing creates weekly anxiety.</li>
                        <li>Never discuss other players' performance with a parent. Ever.</li>
                        <li>Have a 24-hour rule for post-match conversations. Emotions run high immediately after games.</li>
                        <li>Frame all feedback in terms of development, not selection. "Your child is working on X" lands better than "your child didn't play because of Y."</li>
                    </ol>
                </section>

                <section className={styles.section}>
                    <h2>Building team culture at youth level.</h2>
                    <p>Team culture is built in small moments, not big speeches. The way players treat each other after a goal, how the bench reacts to a teammate's mistake, whether players celebrate individual achievement or team achievement — these patterns define culture. Coaches set the tone by what they reward and what they ignore.</p>
                    <p>The best youth team cultures are built on three principles: high standards for effort (not outcome), genuine accountability without shame, and celebration of improvement not just performance. A player who goes from a 58 rating to a 74 rating over a season deserves more recognition than a naturally gifted player who stays at 80 without growing.</p>
                </section>

                <section className={styles.section}>
                    <h2>Using Veyro as a coaching tool.</h2>
                    <p>Veyro is built for exactly this workflow. Players save their own match ratings after each game using the <Link to="/">soccer rating calculator</Link>. Coaches see the team's activity through the <Link to="/coach">coach dashboard</Link>, can review trends over time, and can use the data in individual and team conversations.</p>
                    <p>Setting up your team takes four steps. Create a coach account, set your role, create your team to get a unique join code, and share the <Link to="/onboarding">invite link</Link> with your players. Players tap the link, request to join, and you approve them from the dashboard. From that point forward, every match they save appears in your team view.</p>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>For players</strong><span>A simple calculator, a saved match history, and a clear view of their own trends over the season.</span></div>
                        <div className={styles.card}><strong>For coaches</strong><span>Team activity feed, average ratings by position, recent match history for the full roster, and a clean way to start development conversations.</span></div>
                        <div className={styles.card}><strong>For parents</strong><span>A transparent development record their child owns, which removes the guesswork from development conversations at home.</span></div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>FAQ for youth coaches.</h2>
                    <div className={styles.grid}>
                        <div className={styles.card}><strong>How many players can I manage?</strong><span>Coach and Premium plans support full team rosters. Free accounts are limited to individual use without team management.</span></div>
                        <div className={styles.card}><strong>Do players need to pay?</strong><span>No. Players use the free tier to save up to five matches. Coaches upgrade to Coach or Premium to unlock team management and unlimited tracking for the whole roster.</span></div>
                        <div className={styles.card}><strong>Can I use this for basketball or football too?</strong><span>Yes. Veyro has separate calculators for basketball and football with position-specific formulas for each sport.</span></div>
                        <div className={styles.card}><strong>What age group is this designed for?</strong><span>Any age. The system works for U10 through adult amateur, though the stats tracked should match what is realistic for the age group.</span></div>
                        <div className={styles.card}><strong>How do I get players to actually use it?</strong><span>Make it a team habit from week one. If every player saves their first match rating in the first week of the season, the habit is set. If you wait until week four, half the team won't bother.</span></div>
                        <div className={styles.card}><strong>What if a player disagrees with their rating?</strong><span>Good. That conversation is the coaching. A player who argues their rating is too low needs to explain why — which forces them to think analytically about their own performance.</span></div>
                    </div>
                </section>
            </article>
        </main>
    );
}
