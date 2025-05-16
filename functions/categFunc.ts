// implement crud

import { getTranslation } from "./translation"
import type { categoriesTypes, headTypes } from "../types/types";
import { mainDb } from "../database/schema/connections/mainDb";
import { categories } from "../database/schema/shop";
import { and, eq } from "drizzle-orm";
import xss from "xss";
import { sanitizeString } from "./security/xss";

// post 
export const categPost = async ({ body, headers, shopId, userId }: { body : categoriesTypes, headers: headTypes, shopId: string, userId: string}) => {
    // data is already validated
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try {
        const idErr = await getTranslation(lang, "idErr");
        const categMsg = await getTranslation(lang, "categMsg");
        
    // now extract
    if (!shopId || shopId.length < 5) {
        return {
            success: false,
            message: sanitizeString(idErr)
        }
    }
    let { generalName } = body as categoriesTypes;

    // sanitize xss
    generalName = xss(generalName.trim().toLowerCase());

    // Step 1: Check if the category already exists
    const existingCategory = await mainDb
    .select()
    .from(categories)
    .where(
        eq(categories.generalName, generalName)
    );

    // Step 2: if exist return nothing
    if (existingCategory.length > 0) {
        return;
    }

    // now save to database
    await mainDb.insert(categories).values({
        shopId,
        generalName,
    });

    return {
        success: true,
        message: sanitizeString(categMsg)
    }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error 
                    ? error.message 
                    : sanitizeString(await getTranslation(lang, "serverErr"))
        }
    }
}

// get request
export const categGet = async ({headers, shopId} : {headers: headTypes, shopId: string}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try {
        const allCateg = await mainDb
                            .select()
                            .from(categories)
                            .where(eq(categories.shopId, shopId));

        if(allCateg.length === 0) {
            return {
                success: false,
                message: sanitizeString(await getTranslation(lang, "notFound")),
                data: []
            }
        }

        return {
            success: true,
            message: sanitizeString(await getTranslation(lang, "success")),
            data: allCateg
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error 
                    ? error.message 
                    : sanitizeString(await getTranslation(lang, "serverErr"))
        }
    }
}

// update
export const categPut = async ({ body, headers, categoryId, shopId }: { body : categoriesTypes, headers: headTypes, categoryId: string, shopId: string}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try {
    
    // now extract
    let { generalName } = body as categoriesTypes;

    // prevent xss
    generalName = xss(generalName)


    // Validate ID length before querying (optional)
    if (!categoryId || categoryId.length < 5) {
        return {
            success: false,
            message: await getTranslation(lang, "idErr")
        };
    }

    // Update the category where id matches
    const updateCateg = await mainDb
        .update(categories)
        .set({
            generalName,
        })
        .where(
            and(
                eq(categories.shopId, shopId),
                eq(categories.id, categoryId)
            )
        )
        

    if (!updateCateg) {
        return {
            success: false,
            message: await getTranslation(lang, "notFound")
        }
    }

    return {
        success: true,
        message: await getTranslation(lang, "update")
    }

    } catch (error) {
        return {
            success: false,
            message: error instanceof Error 
                    ? error.message 
                    : sanitizeString(await getTranslation(lang, "serverErr"))
        }
    }
}

// delete
export const categDel = async ({ headers, categoryId, shopId }: {headers: headTypes, categoryId: string, shopId: string}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";

    try { 
    
        // Validate ID length before querying (optional)
        if (!categoryId || categoryId.length < 5) {
            return {
                success: false,
                message: await getTranslation(lang, "idErr")
            };
        }

        // delete from db
        const categDel = await mainDb.delete(categories)
                            .where(
                                and(
                                    eq(categories.id, categoryId),
                                    eq(categories.shopId, shopId)
                                )
                            );

        if (!categDel) {
            return {
                success: false,
                message: sanitizeString(await getTranslation(lang, "notFound"))
            }
        }

        return{
            success: true,
            message: sanitizeString(await getTranslation(lang, "delMsg"))
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error 
                    ? error.message 
                    : sanitizeString(await getTranslation(lang, "serverErr"))
        }
    }
} 

// update and delete data has no length use !data to ensure is valid