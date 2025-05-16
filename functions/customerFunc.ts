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

    // Extract the validated data
    let {name, contact} = body as CustomerTypes;

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

// Use Redis cache instance

export const customerGet = async ({
  userId,
  shopId,
  headers,
  query
}: {
  userId: string;
  shopId: string;
  headers: headTypes;
  query: ProductQuery;
}) => {
  const lang = headers["accept-language"]?.split(",")[0] || "sw";

  const page = parseInt(query.page || '1');
  const limit = parseInt(query.limit || '10');
  const search = query.search || '';
  const offset = (page - 1) * limit;

  try {

    // 🔥 If not in cache → fetch from DB
    const where = and(
      eq(customers.shopId, shopId),
      search ? ilike(customers.name, `%${search}%`) : undefined
    );

    // Get total count
    const total = await mainDb
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(where || undefined)
      .then((rows) => Number(rows[0].count));

    // Fetch customers
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
      };
    }


    return {
      success: true,
      message: await getTranslation(lang, "success"),
      data: existingCustomer,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error
        ? error.message
        : sanitizeString(await getTranslation(lang, "serverErr"))
    };
  }
};

export const customerFetch = async ({ userId, shopId, headers }: {
    userId: string;
    shopId: string;
    headers: headTypes;
}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";

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
        return {
            success: false,
            message: error instanceof Error
                    ? error.message
                    : sanitizeString(await getTranslation(lang, "serverErr"))
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
        return {
            success: false,
            message: error instanceof Error
                    ? error.message
                    : sanitizeString(await getTranslation(lang, "serverErr"))
        }
    }
}


export const customerUpdate = async ({userId, shopId, customerId, body, headers}: {userId: string, shopId: string, customerId: string, body: CustomerTypes, headers: headTypes}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try{

        let  { name, contact } = body as CustomerTypes;


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
        return {
            success: false,
            message: error instanceof Error
                    ? error.message
                    : sanitizeString(await getTranslation(lang, "serverErr"))
        }
    }
}
