import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Sidebar from "./components/Sidebar";

// Soccer pages
const Calculator = lazy(() => import("./pages/Calculator"));
const Vault = lazy(() => import("./pages/Vault"));
const Graph = lazy(() => import("./pages/Graph"));
const Analysis = lazy(() => import("./pages/Analysis"));
const Compare = lazy(() => import("./pages/Compare"));
const Profile = lazy(() => import("./pages/Profile"));
const Team = lazy(() => import("./pages/Team"));
const Coach = lazy(() => import("./pages/Coach"));
const VideoAI = lazy(() => import("./pages/VideoAI"));
const Admin = lazy(() => import("./pages/Admin"));
const Recruiting = lazy(() => import("./pages/Recruiting"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const ForCoaches = lazy(() => import("./pages/ForCoaches"));
const OtherSports = lazy(() => import("./pages/OtherSports"));
const SoccerPerformanceGuide = lazy(() => import("./pages/SoccerPerformanceGuide"));
const SoccerRatingCalculator = lazy(() => import("./pages/SoccerRatingCalculator"));
const SoccerPlayerStatsTracker = lazy(() => import("./pages/SoccerPlayerStatsTracker"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const JoinTeam = lazy(() => import("./pages/JoinTeam"));
const HowToRateSoccerPlayers = lazy(() => import("./pages/HowToRateSoccerPlayers"));
const YouthCoachPlaybook = lazy(() => import("./pages/YouthCoachPlaybook"));
const PlayerPerformanceAnalytics = lazy(() => import("./pages/PlayerPerformanceAnalytics"));
const BasketballRatingSystem = lazy(() => import("./pages/BasketballRatingSystem"));
const FootballRatingSystem = lazy(() => import("./pages/FootballRatingSystem"));

// Basketball pages
const BasketballCalculator = lazy(() => import("./pages/basketball/Calculator"));
const BasketballVault = lazy(() => import("./pages/basketball/Vault"));
const BasketballGraph = lazy(() => import("./pages/basketball/Graph"));
const BasketballAnalysis = lazy(() => import("./pages/basketball/Analysis"));
const BasketballCompare = lazy(() => import("./pages/basketball/Compare"));
const BasketballProfile = lazy(() => import("./pages/basketball/Profile"));
const BasketballTeam = lazy(() => import("./pages/basketball/Team"));
const BasketballCoach = lazy(() => import("./pages/basketball/Coach"));
const BasketballRecruiting = lazy(() => import("./pages/basketball/Recruiting"));
const BasketballVideoAI = lazy(() => import("./pages/basketball/VideoAI"));

// Football pages
const FootballCalculator = lazy(() => import("./pages/football/Calculator"));
const FootballVault = lazy(() => import("./pages/football/Vault"));
const FootballGraph = lazy(() => import("./pages/football/Graph"));
const FootballAnalysis = lazy(() => import("./pages/football/Analysis"));
const FootballCompare = lazy(() => import("./pages/football/Compare"));
const FootballProfile = lazy(() => import("./pages/football/Profile"));
const FootballTeam = lazy(() => import("./pages/football/Team"));
const FootballCoach = lazy(() => import("./pages/football/Coach"));
const FootballRecruiting = lazy(() => import("./pages/football/Recruiting"));
const FootballVideoAI = lazy(() => import("./pages/football/VideoAI"));

function RouteLoading() {
    return (
        <main className="route-loading" aria-live="polite" aria-busy="true">
            <div className="route-loading-card">
                <span>V</span>
                <strong>Opening Veyro</strong>
                <p>Loading this workspace...</p>
            </div>
        </main>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Sidebar />
                <Suspense fallback={<RouteLoading />}>
                    <Routes>
                        {/* Soccer */}
                        <Route path="/" element={<Calculator />} />
                        <Route path="/vault" element={<Vault />} />
                        <Route path="/graph" element={<Graph />} />
                        <Route path="/analysis" element={<Analysis />} />
                        <Route path="/compare" element={<Compare />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/team" element={<Team />} />
                        <Route path="/coach" element={<Coach />} />
                        <Route path="/video" element={<VideoAI />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/recruiting" element={<Recruiting />} />

                        {/* Static / SEO pages */}
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/for-coaches" element={<ForCoaches />} />
                        <Route path="/other-sports" element={<OtherSports />} />
                        <Route path="/soccer-performance-guide" element={<SoccerPerformanceGuide />} />
                        <Route path="/soccer-rating-calculator" element={<SoccerRatingCalculator />} />
                        <Route path="/soccer-player-stats-tracker" element={<SoccerPlayerStatsTracker />} />

                        {/* Basketball */}
                        <Route path="/basketball" element={<BasketballCalculator />} />
                        <Route path="/basketball/vault" element={<BasketballVault />} />
                        <Route path="/basketball/graph" element={<BasketballGraph />} />
                        <Route path="/basketball/analysis" element={<BasketballAnalysis />} />
                        <Route path="/basketball/compare" element={<BasketballCompare />} />
                        <Route path="/basketball/profile" element={<BasketballProfile />} />
                        <Route path="/basketball/team" element={<BasketballTeam />} />
                        <Route path="/basketball/coach" element={<BasketballCoach />} />
                        <Route path="/basketball/recruiting" element={<BasketballRecruiting />} />
                        <Route path="/basketball/video" element={<BasketballVideoAI />} />

                        {/* Football */}
                        <Route path="/football" element={<FootballCalculator />} />
                        <Route path="/football/vault" element={<FootballVault />} />
                        <Route path="/football/graph" element={<FootballGraph />} />
                        <Route path="/football/analysis" element={<FootballAnalysis />} />
                        <Route path="/football/compare" element={<FootballCompare />} />
                        <Route path="/football/profile" element={<FootballProfile />} />
                        <Route path="/football/team" element={<FootballTeam />} />
                        <Route path="/football/coach" element={<FootballCoach />} />
                        <Route path="/football/recruiting" element={<FootballRecruiting />} />
                        <Route path="/football/video" element={<FootballVideoAI />} />
                        {/* Coach onboarding */}
                        <Route path="/onboarding" element={<Onboarding />} />
                        <Route path="/join/:code" element={<JoinTeam />} />

                        {/* SEO blog posts */}
                        <Route path="/how-to-rate-soccer-players" element={<HowToRateSoccerPlayers />} />
                        <Route path="/youth-coach-playbook" element={<YouthCoachPlaybook />} />
                        <Route path="/player-performance-analytics" element={<PlayerPerformanceAnalytics />} />
                        <Route path="/basketball-rating-system" element={<BasketballRatingSystem />} />
                        <Route path="/football-rating-system" element={<FootballRatingSystem />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </AuthProvider>
    );
}
