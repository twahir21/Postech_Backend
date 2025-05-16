import { eq } from "drizzle-orm";
import { mainDb } from "../database/schema/connections/mainDb";
import { emailVerifications } from "../database/schema/shop";
import type { headTypes } from "../types/types";
import { getTranslation } from "./translation";

export const homeGet = async({ headers }: {headers: headTypes}) => {

    const lang = headers["accept-language"]?.split(",")[0] || "sw";

    // warm up the database
    try{
        await mainDb.delete(emailVerifications)
                .where(eq(emailVerifications.used, true));
        return {
            success: true,
            message: await getTranslation(lang, "greeting")
        }
    }catch(error) {
        return {
            success: false,
            message: error instanceof Error
                    ? error.message
                    :  await getTranslation(lang, "serverErr")
        }
    }
}