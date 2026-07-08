(function () {
    function friendlyFirebaseError(error, fallback = "Something went wrong. Please try again.") {
        const code = String(error?.code || "").toLowerCase();
        const message = String(error?.message || "");
        const combined = `${code} ${message}`.toLowerCase();

        if (combined.includes("permission") || code.includes("permission-denied")) {
            return "Database access is blocked right now. Refresh and try again, or sign out and sign back in.";
        }
        if (combined.includes("not-found")) {
            return "That saved record was not found anymore. Refresh the page and try again.";
        }
        if (combined.includes("network") || combined.includes("offline") || combined.includes("unavailable")) {
            return "The database connection is unavailable right now. Check your internet connection and try again.";
        }
        if (combined.includes("invalid-argument")) {
            return "One field has an invalid value. Check the form, then try again.";
        }
        if (combined.includes("failed-precondition")) {
            return "The database needs one more setup step before this can load. Try again after the app is updated.";
        }
        if (combined.includes("unauthenticated") || combined.includes("auth")) {
            return "Please sign in again before doing this.";
        }
        return message || fallback;
    }

    window.MatchRatingErrors = {
        friendlyFirebaseError
    };
})();
