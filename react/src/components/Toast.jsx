import { useCallback } from "react";

function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])
    );
}

export function showToast(message, options = {}) {
    let stack = document.querySelector(".app-toast-stack");
    if (!stack) {
        stack = document.createElement("div");
        stack.className = "app-toast-stack";
        stack.setAttribute("aria-live", "polite");
        stack.setAttribute("aria-atomic", "true");
        document.body.appendChild(stack);
    }

    const toast = document.createElement("div");
    toast.className = `app-toast${options.type === "error" ? " error" : ""}`;
    toast.setAttribute("role", options.type === "error" ? "alert" : "status");
    toast.innerHTML = `<span>${escapeHtml(message)}</span>${
        options.detail ? `<small>${escapeHtml(options.detail)}</small>` : ""
    }`;
    stack.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    window.setTimeout(() => {
        toast.classList.remove("show");
        window.setTimeout(() => toast.remove(), 220);
    }, options.duration || 3200);
}

window.MatchRatingToast = { show: showToast };

export function useToast() {
    return useCallback((message, options) => showToast(message, options), []);
}

export default function Toast() {
    return null;
}
