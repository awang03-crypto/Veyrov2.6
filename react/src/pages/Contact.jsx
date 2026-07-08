import { useEffect, useRef, useState } from "react";
import { ADMIN_EMAIL } from "../lib/adminConfig.js";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import styles from "../styles/Contact.module.css";
import { useMeta } from "../hooks/useMeta.js";

export default function Contact() {
    const formRef = useRef(null);
    const [status, setStatus] = useState(`Messages are sent to ${ADMIN_EMAIL}.`);
    const [submitting, setSubmitting] = useState(false);

    useMeta("Contact Veyro | Get Help", "Contact the Veyro team with questions, feedback, or partnership enquiries about our player performance tracking platform.");

    async function handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        setSubmitting(true);
        setStatus("Sending your feedback...");
        try {
            try {
                await addDoc(collection(db, "feedbackMessages"), {
                    name: String(formData.get("name") || ""),
                    email: String(formData.get("email") || ""),
                    message: String(formData.get("message") || ""),
                    page: "contact",
                    timestamp: Date.now(),
                });
            } catch (err) {
                console.warn("Could not store feedback in Firestore:", err);
            }
            const response = await fetch(`https://formsubmit.co/ajax/${ADMIN_EMAIL}`, {
                method: "POST",
                body: formData,
                headers: { Accept: "application/json" },
            });
            if (!response.ok) throw new Error("FormSubmit request failed");
            formRef.current.reset();
            setStatus("Submitted. Thanks for the feedback.");
        } catch (err) {
            console.error("Contact form failed:", err);
            setStatus("Could not send right now. Please try again in a minute.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className={`page ${styles.contactPage}`}>
            <section className={styles.hero}>
                <div className={styles.eyebrow}>Contact Us</div>
                <h1 className={styles.h1}>Send Feedback</h1>
                <p className={styles.p}>Share a bug, a feature idea, or a stat you want added to the calculator.</p>
            </section>
            <form className={styles.contactPanel} ref={formRef} onSubmit={handleSubmit}>
                <input type="hidden" name="_subject" value="New Veyro feedback" />
                <input type="hidden" name="_template" value="table" />
                <input type="hidden" name="_captcha" value="false" />
                <label className={styles.label}>Your Name<input className={styles.input} name="name" type="text" placeholder="Your name" /></label>
                <label className={styles.label}>Email<input className={styles.input} name="email" type="email" placeholder="your@email.com" /></label>
                <label className={styles.label}>Message<textarea className={styles.textarea} name="message" placeholder="What should we know?" required /></label>
                <button className={styles.button} type="submit" disabled={submitting}>{submitting ? "Sending..." : "Send Feedback"}</button>
                <div className={styles.status}>{status}</div>
            </form>
        </main>
    );
}
