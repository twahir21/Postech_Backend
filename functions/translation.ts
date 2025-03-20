import i18next from "i18next";
import Backend from "i18next-fs-backend";
import path from "path";


// Initialize i18next
import { fileURLToPath } from "url";

// Resolve __dirname in ES module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize i18next
export const setupI18n = async () => {
    await i18next.use(Backend).init({
        preload: ["en", "sw"],  // Preload languages
        lng: "en",
        fallbackLng: "en",
        backend: {
            loadPath: path.join(__dirname, "languages/{{lng}}.json"),
        },
        interpolation: { escapeValue: false }, // to enable special chars coz default are disabled to prevent XSS attacks
    });

};


// Function to get translation
export const getTranslation = (lng: string, key: string) => {
    return i18next.getFixedT(lng)(key);
};
