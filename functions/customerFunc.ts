import { z } from "zod";
import { mainDb } from "../database/schema/connections/mainDb";
import type { CustomerTypes, headTypes, ProductQuery } from "../types/types";
import { sanitizeString } from "./security/xss";
import { customers } from "../database/schema/shop";
import { and, eq, ilike, sql } from "drizzle-orm";
import { getTranslation } from "./translation";

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
        })
        .returning();
    const data = insertCustomers[0];

    return {
        success: true,
        message: "Umefanikiwa kuingiza mteja",
        data: data
    };
}

export const customerGet = async ({ userId, shopId, headers, query}: {
    userId: string;
    shopId: string;
    headers: headTypes;
    query: ProductQuery
}) => {
    const lang: any = headers["accept-language"]?.split(",") || "sw";

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const search = query.search || '';
    
    const offset = (page - 1) * limit;

    
    // Build filter condition
    const where = and(
        eq(customers.shopId, shopId),
        search ? ilike(customers.name, `%${search}%`) : undefined
      );
      

    try {
    // Get total count
    const total = await mainDb
    .select({ count: sql<number>`count(*)` }) // ✅ sql<number> for type hint
    .from(customers)
        .where(where || undefined)
        .then((rows) => Number(rows[0].count));

    // check if the customer already exists
    const existingCustomer = await mainDb
    .select()
    .from(customers)
    .where(where)
    .orderBy(customers.createdAt)
    .limit(limit)
    .offset(offset);


    if (existingCustomer.length === 0) {
        return {
            success: false,
            message: "Hakuna mteja aliyeingizwa",
            data: [],
            total
        }
    }
    
return {
    success: true,
    data: existingCustomer,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit)
  }
  
    } catch (error) {
        if (error instanceof Error) {
            return {
                messsage: error.message,
                success: false
            }
        }else{
            return {
                messsage: sanitizeString(await getTranslation(lang, "serverErr")),
                success: false
            }
        }
      }


}

export const customerFetch = async ({ userId, shopId, headers }: {
    userId: string;
    shopId: string;
    headers: headTypes;
}) => {
    const lang: any = headers["accept-language"]?.split(",") || "sw";

    try {
    const existingCustomer = await mainDb
                                    .select()
                                    .from(customers)
                                    .where(eq(customers.shopId, shopId));

    if (existingCustomer.length === 0) {
        return {
            success: false,
            message: "Hakuna mteja aliyeingizwa",
            data: [],
        }
    }

return {
    success: true,
    data: existingCustomer
}
    } catch (error) {
        if (error instanceof Error) {
            return {
                messsage: error.message,
                success: false
            }
        }else{
            return {
                messsage: sanitizeString(await getTranslation(lang, "serverErr")),
                success: false
            }
        }
      }


}


export const CustomerDel = async ({ userId, shopId, customerId, headers }: { userId: string, shopId: string, customerId: string, headers: headTypes }) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try{
        // check if product exists
        const customer = await mainDb
        .select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .then((rows) => rows[0]);
    
        if (!customer) {
            return {
                success: false,
                message: "Hakuna bidhaa kwa jina hili"
            }
        }
    
        // delete product
        await mainDb.delete(customers).where(eq(customers.id, customerId));
    
        return {
            success: true,
            message: "Mteja ameondolewa kwa mafanikio"
        }
    }catch(error){
        if (error instanceof Error) {
            return {
                messsage: error.message,
                success: false
            }
        }else{
            return {
                messsage: sanitizeString(await getTranslation(lang, "serverErr")),
                success: false
            }
        }
    }
}


export const customerUpdate = async ({userId, shopId, customerId, body, headers}: {userId: string, shopId: string, customerId: string, body: CustomerTypes, headers: headTypes}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try{

    // Validate product data
    const schema = z.object({
        name: z.string().min(2, "Jina haliwezi kuwa na herufi chini ya mbili"),
        contact: z.string().min(2, "Mawasiliano hayawezi kuwa na herufi chini ya mbili"),
    });
    
        const parsed = schema.safeParse(body);
    
        if (!parsed.success) {
            return {
                success: false,
                message: parsed.error.format()
            }
        }



        let  { name, contact } : CustomerTypes = parsed.data;


        // sanitize or remove xss scripts if available
        name = sanitizeString(name);
        contact = sanitizeString(contact);



        // check if product exists
        const customer = await mainDb
        .select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .then((rows) => rows[0]);
    
        if (!customer) {
            return {
                success: false,
                message: "Hakuna mteja kwa jina hili"
            }
        }

        // update customer
        const updatedCustomers = await mainDb.update(customers).set({
            name,
            contact      
        }).where(eq(customers.id, customerId));


    
        return {
            success: true,
            data: updatedCustomers,
            message: await getTranslation(lang, "success")
        }

    }catch(error){
        if (error instanceof Error) {
            return {
                messsage: error.message,
                success: false
            }
        }else{
            return {
                messsage: sanitizeString(await getTranslation(lang, "serverErr")),
                success: false
            }
        }
    }
}
