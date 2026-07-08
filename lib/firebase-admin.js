import admin from "firebase-admin";

let app = null;

function parseServiceAccount() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        if (parsed.private_key) {
            parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
        }
        return admin.credential.cert(parsed);
    }

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        return admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        });
    }

    return null;
}

export function getAdminFirestore() {
    if (!app) {
        const credential = parseServiceAccount();
        if (!credential) return null;
        app = admin.apps.length ? admin.apps[0] : admin.initializeApp({ credential });
    }
    return admin.firestore(app);
}

export function getAdminAuth() {
    if (!app) {
        const credential = parseServiceAccount();
        if (!credential) return null;
        app = admin.apps.length ? admin.apps[0] : admin.initializeApp({ credential });
    }
    return admin.auth(app);
}
