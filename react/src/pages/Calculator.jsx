import { useEffect, useRef, useState } from "react";
import { useMeta } from "../hooks/useMeta.js";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { calculateSoccerRating } from "../services/ratings";
import styles from "../styles/Calculator.module.css";

export default function Calculator({ startInCalculator = false }) {
    const { user, profile, loading } = useAuth();
    const navigate = useNavigate();
    const [showCalc, setShowCalc] = useState(startInCalculator);
    const [showAuth, setShowAuth] = useState(null);
    const [authError, setAuthError] = useState("");
    const [rating, setRating] = useState(82);
    const [position, setPosition] = useState("mid");
    const [stats, setStats] = useState({
        minutes: 72,
        passes: 24,
        shots: 2,
        duels: 6,
        turnovers: 3,
        goals: 0,
        assists: 1
    });

    useEffect(() => {
        document.title = "Soccer Match Rating Calculator | Track Player Performance";
        // Meta description
        let metaDesc = document.querySelector("meta[name=description]");
        if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.setAttribute("name", "description"); document.head.appendChild(metaDesc); }
        metaDesc.setAttribute("content", "Free soccer match rating calculator. Rate goalkeeper, defender, midfielder, and attacker performances using position-specific formulas. Save to your match vault.");
        const schema = {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Veyro Soccer Match Rating Calculator",
            "description": "Free soccer player match rating calculator. Rate goalkeeper, defender, midfielder, and attacker performances using position-specific stat formulas.",
            "applicationCategory": "SportsApplication",
            "operatingSystem": "Web",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "publisher": { "@type": "Organization", "name": "Veyro", "url": "https://darksalmon-lark-983637.hostingersite.com" }
        };
        const faqSchema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                { "@type": "Question", "name": "How does Veyro rate soccer players?", "acceptedAnswer": { "@type": "Answer", "text": "Veyro uses a position-specific formula that starts with a base score and adds or subtracts based on stats like goals, assists, passes, duels, and turnovers, scaled by minutes played." }},
                { "@type": "Question", "name": "Is the soccer rating calculator free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. The calculator is free. Free accounts can save up to 5 matches. Coach and Premium plans unlock unlimited saves and team management." }},
                { "@type": "Question", "name": "What positions does Veyro support?", "acceptedAnswer": { "@type": "Answer", "text": "Goalkeeper, defender, midfielder, and attacker. Basketball and football positions are also supported in separate calculators." }}
            ]
        };
        [schema, faqSchema].forEach(s => {
            const el = document.createElement('script');
            el.type = 'application/ld+json';
            el.text = JSON.stringify(s);
            document.head.appendChild(el);
        });
    }, []);

    useEffect(() => {
        if (!loading && user) {
            if (profile?.position) setPosition(profile.position);
        }
    }, [loading, user, profile]);

    function handleContinueGuest() { setShowCalc(true); }

    function updateStat(key, value) {
        const nextStats = { ...stats, [key]: Number(value || 0) };
        setStats(nextStats);
        setRating(calculateSoccerRating(nextStats, position));
    }

    function updatePosition(value) {
        setPosition(value);
        setRating(calculateSoccerRating(stats, value));
    }

    function saveBenchmark() {
        sessionStorage.setItem("pendingRatingData", JSON.stringify({
            finalScore: rating,
            position,
            statInputs: {
                accurate_pass: stats.passes,
                ontarget_scoring_att: stats.shots,
                duel_won: stats.duels,
                poss_lost_ctrl: stats.turnovers
            },
            decisiveInputs: {
                dec_goal: stats.goals,
                dec_assist: stats.assists
            }
        }));
        navigate("/vault");
    }

    async function handleSignOut() {
        try { await signOut(auth); setShowCalc(false); } catch (e) { console.error(e); }
    }

    async function handleEmailSignup(e) {
        e.preventDefault();
        setAuthError("");
        const fd = new FormData(e.target);
        try {
            const cred = await createUserWithEmailAndPassword(auth, fd.get("email"), fd.get("password"));
            await setDoc(doc(db, "users", cred.user.uid), { playerName: fd.get("name") || "", position: fd.get("position") || "mid", createdAt: serverTimestamp() }, { merge: true });
            await sendEmailVerification(cred.user);
            setShowAuth(null);
            setShowCalc(true);
        } catch (err) { setAuthError(err.message); }
    }

    async function handleEmailSignin(e) {
        e.preventDefault();
        setAuthError("");
        const fd = new FormData(e.target);
        try {
            await signInWithEmailAndPassword(auth, fd.get("email"), fd.get("password"));
            setShowAuth(null);
            setShowCalc(true);
        } catch (err) { setAuthError(err.message); }
    }

    async function handleGoogleSignin() {
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
            setShowAuth(null);
            setShowCalc(true);
        } catch (err) { setAuthError(err.message); }
    }

    if (loading) {
        return (
            <div className={`container ${styles.calcPage}`}>
                <section className={styles.homePage}>
                    <div className={styles.homeShell}>
                        <div className={styles.homeCopy}>
                            <h1 className={styles.h1}>Veyro</h1>
                            <p className={styles.homeSubtitle}>Built for players, parents, and coaches tracking real match progress. Turn match stats into a live rating, save every game, and see improvement clearly.</p>
                            <div className={styles.authLoading}>
                                <span className={styles.authLoadingMark}>V</span>
                                <span className={styles.authLoadingCopy}><strong>Opening Veyro</strong><small>Checking your saved sign-in...</small></span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    if (!user && !showCalc) {
        return (
            <div className={`container ${styles.calcPage}`}>
                <section className={styles.homePage}>
                    <div className={styles.homeShell}>
                        <div className={styles.homeCopy}>
                            <h1 className={styles.h1}>Veyro</h1>
                            <p className={styles.homeSubtitle}>Built for players, parents, and coaches tracking real match progress. Turn match stats into a live rating, save every game, and see improvement clearly.</p>
                            {showAuth === "signup" ? (
                                <form className={styles.authForm} onSubmit={handleEmailSignup}>
                                    <h2>Create Account</h2>
                                    <input name="name" type="text" placeholder="Player name" required />
                                    <input name="email" type="email" placeholder="Email" required />
                                    <input name="password" type="password" placeholder="Password" minLength={6} required />
                                    <select name="position"><option value="mid">Midfielder</option><option value="att">Attacker</option><option value="def">Defender</option><option value="gk">Goalkeeper</option></select>
                                    {authError && <div className={styles.authError}>{authError}</div>}
                                    <button type="submit" className={styles.primaryAction}>Sign Up</button>
                                    <button type="button" className={styles.secondaryAction} onClick={handleGoogleSignin}>Sign in with Google</button>
                                    <button type="button" className={styles.guestAction} onClick={() => setShowAuth(null)}>Cancel</button>
                                </form>
                            ) : showAuth === "signin" ? (
                                <form className={styles.authForm} onSubmit={handleEmailSignin}>
                                    <h2>Sign In</h2>
                                    <input name="email" type="email" placeholder="Email" required />
                                    <input name="password" type="password" placeholder="Password" required />
                                    {authError && <div className={styles.authError}>{authError}</div>}
                                    <button type="submit" className={styles.primaryAction}>Sign In</button>
                                    <button type="button" className={styles.secondaryAction} onClick={handleGoogleSignin}>Sign in with Google</button>
                                    <button type="button" className={styles.guestAction} onClick={() => setShowAuth(null)}>Cancel</button>
                                </form>
                            ) : (
                                <div className={styles.homeActions}>
                                    <button className={styles.primaryAction} onClick={() => setShowAuth("signup")}>Sign Up - Start Tracking</button>
                                    <button className={styles.secondaryAction} onClick={() => setShowAuth("signin")}>Sign In</button>
                                    <button className={styles.guestAction} onClick={handleContinueGuest}>Continue as Guest</button>
                                </div>
                            )}
                            <div className={styles.homeProof}>
                                Track ratings, match notes, trends, and coach feedback in one place.
                            </div>
                        </div>
                        <aside className={styles.homePanel}>
                            <h2>Rate the match. Learn the pattern. Improve the next game.</h2>
                            <div className={styles.ratingPreview}>
                                <div className={styles.ratingPreviewTop}>
                                    <div><div className={styles.ratingPreviewKicker}>Last match</div><div className={styles.ratingPreviewScore}>84<span>/100</span></div></div>
                                    <div className={styles.ratingPreviewMeta}>MID / 72 MIN</div>
                                </div>
                                <div className={styles.ratingPreviewBars}>
                                    <div className={styles.ratingPreviewBar}><span>Passing</span><i style={{"--value": "88%"}} /><b>88</b></div>
                                    <div className={styles.ratingPreviewBar}><span>Possession</span><i style={{"--value": "76%"}} /><b>76</b></div>
                                    <div className={styles.ratingPreviewBar}><span>Attacking</span><i style={{"--value": "82%"}} /><b>82</b></div>
                                </div>
                                <div className={styles.ratingPreviewMetaLine}>
                                    <span>2 assists</span>
                                    <span>6 duels won</span>
                                </div>
                            </div>
                            <div className={styles.matchFlow} aria-label="How Veyro turns match actions into improvement">
                                <div className={styles.flowStep}>
                                    <span className={styles.flowNumber}>1</span>
                                    <span>
                                        <strong>Rate</strong>
                                        <p>Enter match actions and get a live score out of 100.</p>
                                    </span>
                                </div>
                                <div className={styles.flowStep}>
                                    <span className={styles.flowNumber}>2</span>
                                    <span>
                                        <strong>Save</strong>
                                        <p>Store every game with opponent, date, minutes, and notes.</p>
                                    </span>
                                </div>
                                <div className={styles.flowStep}>
                                    <span className={styles.flowNumber}>3</span>
                                    <span>
                                        <strong>Improve</strong>
                                        <p>Compare trends and find the next focus for your game.</p>
                                    </span>
                                </div>
                            </div>
                            <div className={styles.seoStack}>
                                <div className={styles.seoCard}>
                                    <strong>Live calculator</strong>
                                    <span>Input your match actions and see your score update as you type.</span>
                                </div>
                                <div className={styles.seoCard}>
                                    <strong>Personal vault</strong>
                                    <span>Save games with opponent, date, scoreline, minutes, and full stats.</span>
                                </div>
                                <div className={styles.seoCard}>
                                    <strong>Graphs and analysis</strong>
                                    <span>Track trends, compare games, benchmark against players your age, and find strengths to build on.</span>
                                </div>
                            </div>
                            <span className={styles.authNote}>Your profile locks your name and position so every saved match stays clean.</span>
                        </aside>
                    </div>
                    <div className={styles.seoLanding} aria-label="About Veyro">
                        <section className={styles.seoSection}>
                            <h2>Soccer player stats tracker built for real match reflection.</h2>
                            <p>Veyro helps youth soccer players, parents, and coaches turn match actions into a clear performance snapshot. Instead of guessing how a game went, players can calculate a soccer match rating, save their stats, and review progress over time.</p>
                            <div className={styles.seoFeatureGrid}>
                                <div className={styles.seoInfoCard}><strong>Calculate a match rating</strong><span>Enter position-specific soccer stats and decisive moments to create a live rating out of 100.</span></div>
                                <div className={styles.seoInfoCard}><strong>Track player performance</strong><span>Save games with opponent, date, result, minutes, full calculator inputs, and match notes.</span></div>
                                <div className={styles.seoInfoCard}><strong>Analyze improvement</strong><span>Use graphs, strengths, weaknesses, per-90 stats, and comparisons to find the next focus.</span></div>
                            </div>
                        </section>
                        <section className={styles.seoSection}>
                            <h2>Simple plans for launch.</h2>
                            <p>Veyro starts free for players, then adds paid team and Video AI upgrades once users are ready to save more, coach a roster, or turn clips into reports.</p>
                            <div className={styles.pricingGrid}>
                                <div className={styles.pricingCard}><strong>Free</strong><div className={styles.pricingPrice}>$0<small>/month</small></div><span>Soccer calculator, 5 saved matches, basic vault and notes.</span></div>
                                <div className={`${styles.pricingCard} ${styles.featured}`}><strong>Coach</strong><div className={styles.pricingPrice}>$9<small>/month</small></div><span>Unlimited matches, team code, roster management, and team trends.</span></div>
                                <div className={styles.pricingCard}><strong>Premium</strong><div className={styles.pricingPrice}>$19<small>/month</small></div><span>Everything in Coach plus Video AI, exports, and premium reports.</span></div>
                            </div>
                        </section>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className={`container ${styles.calcPage}`}>
            {user && !showCalc && (
                <section className={styles.homePage}>
                    <div className={styles.homeShell}>
                        <div className={styles.homeCopy}>
                            <h1 className={styles.h1}>Veyro</h1>
                            <div className={styles.profileChip}>
                                <div className={styles.profileAvatar}>V</div>
                                <div><small>Account email</small><strong>{user.email || "Signed in"}</strong></div>
                            </div>
                            <div className={styles.homeActions}>
                                <button className={styles.primaryAction} onClick={() => setShowCalc(true)}>Go to Calculator</button>
                                <button className={styles.secondaryAction} onClick={() => navigate("/vault")}>Open Vault</button>
                                <button className={styles.secondaryAction} onClick={handleSignOut}>Sign Out</button>
                            </div>
                        </div>
                    </div>
                </section>
            )}
            {(showCalc || user) && (
                <section className={styles.calculatorSection} id="calculatorSection">
                    <div className={styles.heroShell}>
                        <span className={styles.heroTopline}>Live calculator</span>
                        <div className={styles.heroTitle}>
                            <h2>Soccer Match Rating</h2>
                            <div className={styles.liveScore} id="liveScore">{rating}<span>/100</span></div>
                        </div>
                        <p className={styles.calculatorIntro}>Enter the core actions from your match. Your score updates live, then you can send it to the Vault when you are ready.</p>
                        <div className={styles.heroMeta}>
                            <div className={styles.metaCard}><span>Mode</span><strong>Rate</strong></div>
                            <div className={styles.metaCard}><span>Saved to</span><strong>Vault</strong></div>
                            <div className={styles.metaCard}><span>Output</span><strong>Benchmark</strong></div>
                        </div>
                    </div>
                    <div className={styles.categoriesGrid} id="categoriesGrid">
                        <section className={styles.calculatorCard}>
                            <div className={styles.fieldGrid}>
                                <label>Position
                                    <select value={position} onChange={(event) => updatePosition(event.target.value)}>
                                        <option value="gk">Goalkeeper</option>
                                        <option value="def">Defender</option>
                                        <option value="mid">Midfielder</option>
                                        <option value="att">Attacker</option>
                                    </select>
                                </label>
                                <label>Minutes
                                    <input type="number" min="1" max="120" value={stats.minutes} onChange={(event) => updateStat("minutes", event.target.value)} />
                                </label>
                                <label>Completed Passes
                                    <input type="number" min="0" value={stats.passes} onChange={(event) => updateStat("passes", event.target.value)} />
                                </label>
                                <label>Shots on Target
                                    <input type="number" min="0" value={stats.shots} onChange={(event) => updateStat("shots", event.target.value)} />
                                </label>
                                <label>Duels Won
                                    <input type="number" min="0" value={stats.duels} onChange={(event) => updateStat("duels", event.target.value)} />
                                </label>
                                <label>Turnovers
                                    <input type="number" min="0" value={stats.turnovers} onChange={(event) => updateStat("turnovers", event.target.value)} />
                                </label>
                                <label>Goals
                                    <input type="number" min="0" value={stats.goals} onChange={(event) => updateStat("goals", event.target.value)} />
                                </label>
                                <label>Assists
                                    <input type="number" min="0" value={stats.assists} onChange={(event) => updateStat("assists", event.target.value)} />
                                </label>
                            </div>
                            <div className={styles.benchmarkRow}>
                                <div>
                                    <strong>{rating}/100</strong>
                                    <span>Live benchmark</span>
                                </div>
                                <button className={styles.primaryAction} type="button" onClick={saveBenchmark}>Save & Benchmark</button>
                            </div>
                        </section>
                    </div>
                </section>
            )}
        </div>
    );
}
