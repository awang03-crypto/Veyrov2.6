import { isAdminUser } from "../lib/adminConfig.js";
import { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import MobileNav from "./MobileNav";
import "../styles/sidebar.css";

const links = [
    { path: "/calculator", label: "Calculator", hint: "Rate" },
    { path: "/vault", label: "Vault", hint: "Save" },
    { path: "/compare", label: "Compare", hint: "Two Games" },
    { path: "/graph", label: "Graph", hint: "Trend" },
    { path: "/analysis", label: "Analysis", hint: "Review" },
    { path: "/profile", label: "Profile", hint: "Player", playerOnly: true },
    { path: "/team", label: "Team", hint: "Roster", playerOnly: true },
    { path: "/coach", label: "Coach", hint: "Team", coachOnly: true },
    { path: "/onboarding", label: "Setup", hint: "Onboard", coachOnly: true },
    { path: "/admin", label: "Admin", hint: "Private", adminOnly: true },
    { path: "/video", label: "Video AI", hint: "Auto Stats" },
    { path: "/other-sports", label: "Other Sports", hint: "Expand", footerOnly: true, footerIcon: "activity" },
    { path: "/soccer-performance-guide", label: "Guide", hint: "Learn", footerOnly: true, footerIcon: "book" },
    { path: "/for-coaches", label: "For Coaches", hint: "Teams", footerOnly: true, footerIcon: "users" },
    { path: "/about", label: "About", hint: "Why", footerOnly: true, footerIcon: "info" },
    { path: "/privacy", label: "Privacy", hint: "Data", footerOnly: true, footerIcon: "shield" },
    { path: "/contact", label: "Contact", hint: "Help", footerOnly: true, footerIcon: "mail" },
];

const basketballLinks = [
    { path: "/admin", label: "Back to Soccer", hint: "Admin" },
    { path: "/basketball", label: "Calculator", hint: "Rate" },
    { path: "/basketball/vault", label: "Vault", hint: "Save" },
    { path: "/basketball/graph", label: "Graph", hint: "Trend" },
    { path: "/basketball/analysis", label: "Analysis", hint: "Review" },
    { path: "/basketball/compare", label: "Compare", hint: "Games" },
    { path: "/basketball/profile", label: "Profile", hint: "Player" },
    { path: "/basketball/team", label: "Team", hint: "Roster" },
    { path: "/basketball/coach", label: "Coach", hint: "Team" },
    { path: "/basketball/recruiting", label: "Recruiting", hint: "Summary" },
    { path: "/basketball/video", label: "Video AI", hint: "Shell" },
];

const footballLinks = [
    { path: "/admin", label: "Back to Soccer", hint: "Admin" },
    { path: "/football", label: "Calculator", hint: "Rate" },
    { path: "/football/vault", label: "Vault", hint: "Save" },
    { path: "/football/graph", label: "Graph", hint: "Trend" },
    { path: "/football/analysis", label: "Analysis", hint: "Review" },
    { path: "/football/compare", label: "Compare", hint: "Games" },
    { path: "/football/profile", label: "Profile", hint: "Player" },
    { path: "/football/team", label: "Team", hint: "Roster" },
    { path: "/football/coach", label: "Coach", hint: "Team" },
    { path: "/football/recruiting", label: "Recruiting", hint: "Summary" },
    { path: "/football/video", label: "Video AI", hint: "Shell" },
];

const footerIcons = {
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v5"></path><path d="M12 8h.01"></path></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.6-2.8 8.3-7 10-4.2-1.7-7-5.4-7-10V6l7-3z"></path><path d="M9 12l2 2 4-4"></path></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="6" width="16" height="12" rx="2"></rect><path d="M5 8l7 5 7-5"></path></svg>',
    users: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"></circle><circle cx="17" cy="9" r="2"></circle><path d="M3 19c.8-3.2 2.8-5 6-5s5.2 1.8 6 5"></path><path d="M14 18c.6-1.9 1.8-3 3.5-3 1.5 0 2.7 1 3.2 3"></path></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5A2.5 2.5 0 017.5 3H20v16H7.5A2.5 2.5 0 005 21V5.5z"></path><path d="M5 5.5A2.5 2.5 0 002.5 3H2v16h.5A2.5 2.5 0 015 21"></path><path d="M8 7h8"></path><path d="M8 11h7"></path></svg>',
    activity: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7" cy="7" r="3"></circle><circle cx="17" cy="7" r="3"></circle><circle cx="7" cy="17" r="3"></circle><circle cx="17" cy="17" r="3"></circle></svg>',
};

function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])
    );
}

function initialsFor(name, fallback = "MR") {
    const parts = String(name || fallback).trim().split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : (parts[0] || fallback).slice(0, 2)).toUpperCase();
}

export default function Sidebar() {
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const { user, profile } = useAuth();

    const isAdmin = isAdminUser(user);
    const role = isAdmin ? "Admin" : profile?.role === "coach" ? "Coach" : user ? "Player" : "Guest mode";
    const name = user ? (profile?.playerName || profile?.coachName || user.displayName || user.email || "Signed in") : "Guest";
    const detail = user ? role : "Local browser";
    const avatar = initialsFor(name);

    const isBasketball = location.pathname.startsWith("/basketball");
    const isFootball = location.pathname.startsWith("/football");

    const closeSidebar = useCallback(() => {
        setOpen(false);
        document.body.classList.remove("sidebar-open");
    }, []);

    const openSidebar = useCallback(() => {
        setOpen(true);
        document.body.classList.add("sidebar-open");
    }, []);

    const toggleSidebar = useCallback(() => {
        if (open) closeSidebar();
        else openSidebar();
    }, [open, closeSidebar, openSidebar]);

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === "Escape") closeSidebar(); };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [closeSidebar]);

    useEffect(() => {
        closeSidebar();
    }, [location.pathname, closeSidebar]);

    useEffect(() => {
        const syncVh = () => document.documentElement.style.setProperty("--app-vh", `${window.innerHeight * 0.01}px`);
        syncVh();
        window.addEventListener("resize", syncVh, { passive: true });
        return () => window.removeEventListener("resize", syncVh);
    }, []);

    let visibleLinks;
    let footerLinks = [];
    let brandTitle = "Veyro";
    let brandSubtitle = "Rate. Reflect. Improve.";

    if (isFootball) {
        visibleLinks = footballLinks;
        brandTitle = "Veyro Football";
        brandSubtitle = "Private admin mode";
    } else if (isBasketball) {
        visibleLinks = basketballLinks;
        brandTitle = "Veyro Basketball";
        brandSubtitle = "Private admin mode";
    } else {
        visibleLinks = links.filter((l) => {
            if (l.footerOnly) return false;
            if (l.adminOnly) return isAdmin;
            if (l.coachOnly) return profile?.role === "coach";
            if (l.playerOnly) return user && profile?.role !== "coach";
            return true;
        });
        footerLinks = links.filter((l) => l.footerOnly);
    }

    return (
        <>
            <button
                className="sidebar-toggle"
                type="button"
                aria-label="Open site menu"
                aria-expanded={open ? "true" : "false"}
                onClick={toggleSidebar}
            >
                <span className="sidebar-toggle-lines" aria-hidden="true">
                    <span></span><span></span><span></span>
                </span>
                <span>Menu</span>
            </button>

            <aside className="app-sidebar" aria-label="Site navigation">
                <div className="sidebar-head">
                    <div>
                        <h2 className="sidebar-brand">{brandTitle}</h2>
                        <p className="sidebar-subtitle">{brandSubtitle}</p>
                    </div>
                    <button className="sidebar-close" type="button" aria-label="Close site menu" onClick={closeSidebar}>X</button>
                </div>

                <div className="sidebar-account" aria-live="polite">
                    <span className="sidebar-account-avatar" aria-hidden="true">{escapeHtml(avatar)}</span>
                    <span className="sidebar-account-copy">
                        <span className="sidebar-account-name">{escapeHtml(name)}</span>
                        <span className="sidebar-account-role">{escapeHtml(detail)}</span>
                    </span>
                </div>

                <nav className="sidebar-nav">
                    {visibleLinks.map((link) => (
                        <Link
                            key={link.path}
                            className={`sidebar-link${location.pathname === link.path ? " active" : ""}`}
                            to={link.path}
                            data-sidebar-link={link.path}
                        >
                            {link.label}
                            <span>{link.hint}</span>
                        </Link>
                    ))}
                </nav>

                {footerLinks.length > 0 && !isBasketball && !isFootball && (
                    <div className="sidebar-footer">
                        <div className="sidebar-footer-kicker">Site</div>
                        <div className="sidebar-footer-links">
                            {footerLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    className={location.pathname === link.path ? "active" : ""}
                                    to={link.path}
                                    data-sidebar-link={link.path}
                                    aria-label={link.label}
                                >
                                    <span className="sidebar-footer-icon" dangerouslySetInnerHTML={{ __html: footerIcons[link.footerIcon] || "" }} />
                                    <span className="sidebar-footer-copy">
                                        <span className="sidebar-footer-label">{link.label}</span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </aside>

            <div className="sidebar-scrim" onClick={closeSidebar} />

            <div className="site-account-chip" aria-live="polite">
                <span className="site-account-avatar" aria-hidden="true">{escapeHtml(avatar)}</span>
                <span className="site-account-copy">
                    <span className="site-account-name">{escapeHtml(name)}</span>
                    <span className="site-account-role">{escapeHtml(detail)}</span>
                </span>
            </div>

            <MobileNav onMenuClick={openSidebar} />
        </>
    );
}
