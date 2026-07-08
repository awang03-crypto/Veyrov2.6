import { useEffect } from "react";

/**
 * Sets page <title> and <meta name="description"> for every route.
 * Also injects optional JSON-LD schema.
 *
 * Usage:
 *   useMeta("Page Title | Veyro", "Description under 160 chars.");
 *   useMeta("Page Title", "Description", schemaObject);
 */
export function useMeta(title, description, schema = null) {
    useEffect(() => {
        // Title
        document.title = title;

        // Meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement("meta");
            metaDesc.setAttribute("name", "description");
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute("content", description);

        // OG title + description
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
            ogTitle = document.createElement("meta");
            ogTitle.setAttribute("property", "og:title");
            document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute("content", title);

        let ogDesc = document.querySelector('meta[property="og:description"]');
        if (!ogDesc) {
            ogDesc = document.createElement("meta");
            ogDesc.setAttribute("property", "og:description");
            document.head.appendChild(ogDesc);
        }
        ogDesc.setAttribute("content", description);

        // JSON-LD schema
        let schemaEl = null;
        if (schema) {
            schemaEl = document.createElement("script");
            schemaEl.type = "application/ld+json";
            schemaEl.text = JSON.stringify(schema);
            document.head.appendChild(schemaEl);
        }

        return () => {
            if (schemaEl && document.head.contains(schemaEl)) {
                document.head.removeChild(schemaEl);
            }
        };
    }, [title, description]);
}
