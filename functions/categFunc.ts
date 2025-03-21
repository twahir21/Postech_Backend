// implement crud

import { z } from "zod"
import { getTranslation } from "./translation"
import type { categoriesTypes, headTypes } from "../types/types";
import { mainDb } from "../database/schema/connections/mainDb";
import { categories } from "../database/schema/shop";

export const categPost = async ({ body, headers }: { body : categoriesTypes, headers: headTypes}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try {
    
    // validate the data
    const schema = z.object({
        name: z.string().min(3, await getTranslation(lang, "nameErr")),
        company: z.string().min(3, await getTranslation(lang, "nameErr"))
    });

    const parse = schema.safeParse(body);

    if(!parse.success) {
        return {
            error: parse.error.format(),
            success: false
        }
    }

    // now extract
    const { name, company }: categoriesTypes = parse.data;

    // now save to database
    await mainDb.insert(categories).values({
        name,
        company
    });

    return {
        success: true,
        message: await getTranslation(lang, "categMsg")
    }

    } catch (error) {
        if (error instanceof Error) {
            return {
                error: error.message,
                success: false
            }
        }else{
            return{
                success: false,
                error: await getTranslation(lang, "serverErr")
            }
        }
    }
}