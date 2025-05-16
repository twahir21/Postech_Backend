import i18next from "i18next";
import Backend from "i18next-fs-backend";
import path from "path";
import { fileURLToPath } from "url";
import { LRUCache } from "lru-cache";


// Resolve __dirname in ES module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🏎 **Super Fast LRU Cache for Translations**
const translationCache = new LRUCache<string, string>({
    max: 1000, // Store up to 1000 translations
    ttl: 1000 * 60 * 5, // Expire translations after 5 minutes
    
});

// 🛠 **Initialize i18next** (Lazy Load)
export const setupI18n = async () => {
    await i18next.use(Backend).init({
        fallbackLng: "en",
        backend: {
            loadPath: path.join(__dirname, "languages/{{lng}}.json"),
        },
        interpolation: { escapeValue: false },
    });
};

// 🔄 **Get Translation with Ultra-Fast Caching**
export const getTranslation = async (lng: string, key: string): Promise<string> => {
    const cacheKey = `${lng}:${key}`;

    // ✅ Check Cache First
    if (translationCache.has(cacheKey)) {
        console.log(`⚡ Cache Hit: ${cacheKey}`);
        return translationCache.get(cacheKey) as string;
    }

    // 🚀 Load language only if not already loaded
    if (!i18next.hasLoadedNamespace(lng)) {
        await i18next.changeLanguage(lng);
    }

    // ⏳ Fetch Translation
    console.log(`⏳ Fetching from i18next: ${cacheKey}`);
    const translation = i18next.t(key);

    // 🏎 Store in Cache (for Fast Future Requests)
    translationCache.set(cacheKey, translation);

    return translation;
};
