// implement crud

import { z } from "zod"
import { getTranslation } from "./translation"
import type { headTypes, suppTypes } from "../types/types";
import { mainDb } from "../database/schema/connections/mainDb";
import { suppliers } from "../database/schema/shop";
import { eq } from "drizzle-orm";
import { sanitizeString } from "./security/xss";

// post 
export const suppPost = async ({ body, headers, shopId}: { body : suppTypes, headers: headTypes, shopId: string}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try {
    
    // validate the data
    const schema = z.object({
        company: z.string().min(3, await getTranslation(lang, "nameErr")),
        contact: z.string().min(3, await getTranslation(lang, "contactErr"))
    });

    const parse = schema.safeParse(body);

    if(!parse.success) {
        return {
            message: parse.error.format(),
            success: false
        }
    }

    // now extract
    let { company, contact }: suppTypes = parse.data;

    // remove xss scripts if availabe
    company = sanitizeString(company);
    contact = sanitizeString(contact);

    // now save to database
    await mainDb.insert(suppliers).values({
        shopId,
        company,
        contact
    });

    return {
        success: true,
        message: await getTranslation(lang, "save")
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
export const suppGet = async ({headers} : {headers: headTypes}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try {
        const allSupp = await mainDb.select().from(suppliers);

        if(allSupp.length === 0) {
            return {
                success: false,
                message: await getTranslation(lang, "notFound")
            }
        }

        return {
            success: true,
            message: await getTranslation(lang, "success"),
            data: allSupp
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
export const suppPut = async ({ body, headers, supplierId }: { body : suppTypes, headers: headTypes, supplierId: string}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try {
    
    // validate the data
    const schema = z.object({
        company: z.string().min(3, await getTranslation(lang, "nameErr")),
        contact: z.string().min(4, await getTranslation(lang, "contactErr")),
    });

    const parse = schema.safeParse(body);

    if(!parse.success) {
        return {
            message: parse.error.format(),
            success: false
        }
    }

    // now extract
    let { company, contact }: suppTypes = parse.data;

    // sanitize to remove xss
    company = sanitizeString(company);
    contact = sanitizeString(contact);


    // Validate ID length before querying (optional)
    if (!supplierId || supplierId.length < 5) {
        return {
            success: false,
            message: await getTranslation(lang, "idErr")
        };
    }

    // Update the suppliers where id matches
    const updateSupp = await mainDb
        .update(suppliers)
        .set({
            company,
            contact
        })
        .where(eq(suppliers.id, supplierId));

    if (!updateSupp) {
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
export const suppDel = async ({ headers, supplierId}: {headers: headTypes, supplierId: string}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";


    try { 

        // Validate ID length before querying (optional)
        if (!supplierId || supplierId.length < 5) {
            return {
                success: false,
                message: await getTranslation(lang, "idErr")
            };
        }

        // delete from db
        const suppDel = await mainDb.delete(suppliers).where(eq(suppliers.id, supplierId));

        if (!suppDel) {
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
export const suppGetOne = async ({headers, supplierId} : {headers: headTypes, supplierId: string}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try {

        // Validate ID length before querying (optional)
        if (!supplierId || supplierId.length < 5) {
            return {
                success: false,
                message: await getTranslation(lang, "idErr")
            };
        }

        const oneSupp = await mainDb.select().from(suppliers).where(eq(suppliers.id, supplierId));

        if(oneSupp.length === 0) {
            return {
                success: false,
                message: await getTranslation(lang, "notFound")
            }
        }

        return {
            success: true,
            message: await getTranslation(lang, "success"),
            data: oneSupp[0] || null // ensure doesnot return array
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


