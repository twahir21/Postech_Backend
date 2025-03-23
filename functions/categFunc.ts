// implement crud

import { z } from "zod"
import { getTranslation } from "./translation"
import type { categoriesTypes, headTypes } from "../types/types";
import { mainDb } from "../database/schema/connections/mainDb";
import { categories } from "../database/schema/shop";
import { eq } from "drizzle-orm";

// post 
export const categPost = async ({ body, headers, params }: { body : categoriesTypes, headers: headTypes, params: {shopId: string}}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try {
    
    // validate the data
    const schema = z.object({
        name: z.string().min(3, await getTranslation(lang, "nameErr")),
    });

    const parse = schema.safeParse(body);

    if(!parse.success) {
        return {
            message: parse.error.format(),
            success: false
        }
    }

    // now extract
    const { shopId } = params;
    if (!shopId || shopId.length < 5) {
        return {
            success: false,
            message: await getTranslation(lang, "idErr")
        }
    }
    const { name }: categoriesTypes = parse.data;

    // now save to database
    await mainDb.insert(categories).values({
        shopId,
        name,
    });

    return {
        success: true,
        message: await getTranslation(lang, "categMsg")
    }

    } catch (error) {
        if (error instanceof Error) {
            return {
                message: error.message,
                success: false
            }
        }else{
            return{
                success: false,
                message: await getTranslation(lang, "serverErr")
            }
        }
    }
}

// get request
export const categGet = async ({headers} : {headers: headTypes}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try {
        const allCateg = await mainDb.select().from(categories);

        if(allCateg.length === 0) {
            return {
                success: false,
                message: await getTranslation(lang, "notFound")
            }
        }

        return {
            success: true,
            message: await getTranslation(lang, "success"),
            data: allCateg
        }
    } catch (error) {
        if(error instanceof Error) {
            return {
                success: false,
                message: error.message
            }
        }else{
            return {
                success: false,
                message: await getTranslation(lang, "serverErr")
            }
        }
    }
}

// update
export const categPut = async ({ body, headers, params }: { body : categoriesTypes, headers: headTypes, params: { id: string}}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try {
    
    // validate the data
    const schema = z.object({
        name: z.string().min(3, await getTranslation(lang, "nameErr")),
    });

    const parse = schema.safeParse(body);

    if(!parse.success) {
        return {
            message: parse.error.format(),
            success: false
        }
    }

    // now extract
    const { name }: categoriesTypes = parse.data;

    // extract id from params
    const { id } = params;

    // Validate ID length before querying (optional)
    if (!id || id.length < 5) {
        return {
            success: false,
            message: await getTranslation(lang, "idErr")
        };
    }

    // Update the category where id matches
    const updateCateg = await mainDb
        .update(categories)
        .set({
            name,
        })
        .where(eq(categories.id, id));

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
        if (error instanceof Error) {
            return {
                message: error.message,
                success: false
            }
        }else{
            return{
                success: false,
                message: await getTranslation(lang, "serverErr")
            }
        }
    }
}

// delete
export const categDel = async ({ headers, params}: {headers: headTypes, params: {id: string}}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";


    try { 
        // get id
        const { id } = params;

        // Validate ID length before querying (optional)
        if (!id || id.length < 5) {
            return {
                success: false,
                message: await getTranslation(lang, "idErr")
            };
        }

        // delete from db
        const categDel = await mainDb.delete(categories).where(eq(categories.id, id));

        if (!categDel) {
            return {
                success: false,
                message: await getTranslation(lang, "notFound")
            }
        }

        return{
            success: true,
            message: await getTranslation(lang, "delMsg")
        }
    } catch (error) {
        if (error instanceof Error){
            return {
                success: false,
                message: error.message
            }
        }else{
            return {
                success: false,
                message: await getTranslation(lang, "serverErr")
            }
        }
    }
} 

// fetch one 
export const categGetOne = async ({headers, params} : {headers: headTypes, params: {id : string}}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try {
        const { id } = params;

        // Validate ID length before querying (optional)
        if (!id || id.length < 5) {
            return {
                success: false,
                message: await getTranslation(lang, "idErr")
            };
        }

        const oneCateg = await mainDb.select().from(categories).where(eq(categories.id, id));

        if(oneCateg.length === 0) {
            return {
                success: false,
                message: await getTranslation(lang, "notFound")
            }
        }

        return {
            success: true,
            message: await getTranslation(lang, "success"),
            data: oneCateg[0] || null // ensure doesnot return array
        }
    } catch (error) {
        if(error instanceof Error) {
            return {
                success: false,
                message: error.message
            }
        }else{
            return {
                success: false,
                message: await getTranslation(lang, "serverErr")
            }
        }
    }
}


// update and delete data has no length use !data to ensure is valid