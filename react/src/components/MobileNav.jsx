import { isAdminUser } from "../lib/adminConfig.js";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navIcons = {
    "/calculator": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="3"></rect><path d="M8 7h8"></path><path d="M8 11h2"></path><path d="M14 11h2"></path><path d="M8 15h2"></path><path d="M14 15h2"></path></svg>',
    "/vault": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14v14H5z"></path><path d="M8 6V4h8v2"></path><path d="M8 11h8"></path><path d="M8 15h5"></path></svg>',
    "/team": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3"></circle><circle cx="16" cy="9" r="2.5"></circle><path d="M3 19c.8-3 2.5-5 5-5s4.2 2 5 5"></path><path d="M12.5 18c.7-2.2 2-3.5 3.8-3.5 1.7 0 3 1.2 3.7 3.5"></path></svg>',
    "/coach": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V5h14v14z"></path><path d="M8 9h8"></path><path d="M8 13h5"></path><path d="M16 16l3 3"></path></svg>',
    "/graph": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16"></path><path d="M6 16l4-4 3 3 5-7"></path><path d="M18 8h-4"></path><path d="M18 8v4"></path></svg>',
    "/analysis": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16"></path><path d="M7 16V9"></path><path d="M12 16V5"></path><path d="M17 16v-4"></path></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M4 12h16"></path><path d="M4 17h16"></path></svg>',
};

const shortLabels = {
    "/": "Calc",
    "/vault": "Vault",
    "/team": "Team",
    "/coach": "Coach",
    "/graph": "Graph",
    "/analysis": "Analyze",
};

const hints = {
    "/": "Rate",
    "/vault": "Save",
    "/team": "Roster",
    "/coach": "Team",
    "/graph": "Trend",
    "/analysis": "Review",
};

export default function MobileNav({ onMenuClick }) {
    const location = useLocation();
    const { user, profile } = useAuth();
    const isAdmin = isAdminUser(user);
    const role = isAdmin ? "admin" : profile?.role === "coach" ? "coach" : user ? "player" : "guest";

    const isBasketball = location.pathname.startsWith("/basketball");
    const isFootball = location.pathname.startsWith("/football");

    let navItems;
    if (isBasketball || isFootball) {
        const sport = isFootball ? "/football" : "/basketball";
        navItems = [
            { path: sport, label: "Calc", hint: "Rate" },
            { path: `${sport}/vault`, label: "Vault", hint: "Save" },
            { path: `${sport}/graph`, label: "Graph", hint: "Trend" },
            { path: `${sport}/analysis`, label: "Analysis", hint: "Review" },
            { path: "/admin", label: "Soccer", hint: "Admin" },
        ];
    } else {
        const roleLink = role === "coach" ? { path: "/coach", label: "Coach", hint: "Team" } : role === "player" ? { path: "/team", label: "Team", hint: "Roster" } : null;
        navItems = [
            { path: "/calculator", label: "Calc", hint: "Rate" },
            { path: "/vault", label: "Vault", hint: "Save" },
            roleLink,
            { path: "/graph", label: "Graph", hint: "Trend" },
            { path: "/analysis", label: "Analyze", hint: "Review" },
        ].filter(Boolean);
    }

    return (
        <nav className="mobile-bottom-nav" aria-label="Quick mobile navigation" data-count={navItems.length + 1}>
            {navItems.map((item) => (
                <Link
                    key={item.path}
                    className={`mobile-bottom-link${location.pathname === item.path ? " active" : ""}`}
                    to={item.path}
                >
                    <span className="mobile-bottom-icon" dangerouslySetInnerHTML={{ __html: navIcons[item.path] || navIcons.menu }} />
                    <span>{item.label}</span>
                    <small>{item.hint}</small>
                </Link>
            ))}
            <button className="mobile-bottom-link mobile-bottom-menu" type="button" aria-label="Open full menu" onClick={onMenuClick}>
                <span className="mobile-bottom-icon" dangerouslySetInnerHTML={{ __html: navIcons.menu }} />
                <span>Menu</span>
                <small>More</small>
            </button>
        </nav>
    );
}
