import { z } from "zod";
import { mainDb } from "../database/schema/connections/mainDb";
import type { CustomerTypes, headTypes } from "../types/types";
import { sanitizeString } from "./security/xss";
import { customers } from "../database/schema/shop";
import { eq } from "drizzle-orm";

export const customerPost = async ({ body, userId, shopId, headers}: {
    body: CustomerTypes;
    userId: string;
    shopId: string;
    headers: headTypes;
}) => {
    const lang = headers["accept-language"]?.split(",") || "sw";

    const schema = z.object({
        name: z.string().min(1, "Jina la mteja linahitajika" ),
        contact: z.string().min(1, "Mawasiliano ya mteja yanahitajika" ),
    });

    const safeParsedData = schema.safeParse(body);

    if (!safeParsedData.success) {
        return {
            success: false,
            message: Object.values(safeParsedData.error.format()).join(', '),
        }
    }

    // Extract the validated data
    let {name, contact} = safeParsedData.data;

    // sanitize the data
    name = sanitizeString(name.trim().toLowerCase());
    contact = sanitizeString(contact.trim().toLowerCase());

    // check if the customer already exists
    const existingCustomer = await mainDb
        .select()
        .from(customers)
        .where(eq(customers.name, name));

    
    if (existingCustomer.length > 0) {
        return {
            success: false,
            message: "Mteja huyu tayari yupo",
        }
    }

    // Insert the customer into the database
    const insertCustomers = await mainDb
        .insert(customers)
        .values({
            name,
            contact,
            shopId,
        });
    const data = insertCustomers[0];
    if (!data) {
        return {
            success: false,
            message: "Tatizo limejitokeza",
        }
    }

    return {
        success: true,
        message: "Umefanikiwa kuingiza mteja",
        data: data
    };
}