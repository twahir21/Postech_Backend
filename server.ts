import { Elysia } from "elysia";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import path from "path";

// Initialize i18next for multi-language support
await i18next.use(Backend).init({
    lng: "en", // Default language
    fallbackLng: "en",
    backend: {
        loadPath: path.join(__dirname, "/functions/languages/{{lng}}.json"),
    },
    interpolation: { escapeValue: false },
});

const app = new Elysia()
    .get("/", ({ headers }) => {
        // Get language preference from Accept-Language header
        const lang = headers["accept-language"]?.split(",")[0] || "en";

        // Set i18next language
        i18next.changeLanguage(lang);

        return {
            message: i18next.t("greeting"),
            language: lang
        };
    })
    .listen(3001);

console.log(`🚀 Server running at http://localhost:3001`);
