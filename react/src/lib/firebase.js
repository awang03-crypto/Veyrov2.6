import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = Object.freeze({
    apiKey: "AIzaSyD880xO_LQPO_98yGT8KfksZ1CeJmvATdU",
    authDomain: "matchcalculator-2494f.firebaseapp.com",
    projectId: "matchcalculator-2494f",
    storageBucket: "matchcalculator-2494f.firebasestorage.app",
    messagingSenderId: "239037066316",
    appId: "1:239037066316:web:a2fdb0147be02210c598e9",
    measurementId: "G-MQ7VSZKHJD"
});

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
