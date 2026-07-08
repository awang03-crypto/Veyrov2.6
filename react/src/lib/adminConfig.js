// Central admin configuration — change the email here and it updates everywhere.
// In production this should be driven by an environment variable.
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "awang03@dccs.org";

export function isAdminUser(user) {
    if (!user?.email) return false;
    return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
