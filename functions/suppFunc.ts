// implement crud

import { getTranslation } from "./translation"
import type { headTypes, ProductQuery, suppTypes } from "../types/types";
import { mainDb } from "../database/schema/connections/mainDb";
import { suppliers } from "../database/schema/shop";
import { and, eq, ilike, sql } from "drizzle-orm";
import { sanitizeString } from "./security/xss";
import { isCachedSupplierResponse, MemoryCache } from "./utils/memoryCache";
import { supplierCache } from "./utils/caches";
import { cacheStatsTracker } from "./utils/Stats";

// post 
export const suppPost = async ({ body, headers, shopId}: { body : suppTypes, headers: headTypes, shopId: string}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try {

    // now extract
    let { company, contact } = body as suppTypes;

    // remove xss scripts if availabe
    company = sanitizeString(company.trim().toLowerCase());
    contact = sanitizeString(contact.trim());

    // check if already exists
    const checkSupp = await mainDb
        .select()
        .from(suppliers)
        .where(eq(suppliers.company, company));
        
    if (checkSupp.length > 0) {
        return {
            success: false,
            message: await getTranslation(lang, "exists")
        }
    }



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
        return {
            success: false,
            message: error instanceof Error 
                    ? error.message
                    : await getTranslation(lang, "serverErr") 
        }
    }
}

// get request

export const suppGet = async ({
  headers,
  shopId,
  userId,
  query
}: {
  headers: headTypes;
  shopId: string;
  userId: string;
  query: ProductQuery;
}) => {
  console.time("start");

  const lang = headers["accept-language"]?.split(",")[0] || "sw";

  try {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const search = query.search || '';
    const offset = (page - 1) * limit;

    const cacheKey = `suppliers:${shopId}:${search}:${page}:${limit}`;

    // ✅ Now using singleton cache
    const cached = supplierCache.get(cacheKey);

    if (cached && isCachedSupplierResponse(cached)) {
        cacheStatsTracker.recordHit('supplierCache');

      return {
        success: true,
        test: "Is this Cached?", 
        message: await getTranslation(lang, "success"),
        ...cached
      };
    }
    cacheStatsTracker.recordMiss('supplierCache');

    // Build filter condition
    const where = and(
      eq(suppliers.shopId, shopId),
      search ? ilike(suppliers.company, `%${search}%`) : undefined
    );

    // Get total count
    const total = await mainDb
      .select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(where || undefined)
      .then((rows) => Number(rows[0].count));

    // Fetch suppliers
    const existingSuppliers = await mainDb
      .select()
      .from(suppliers)
      .where(where)
      .orderBy(suppliers.createdAt)
      .limit(limit)
      .offset(offset);

    if (existingSuppliers.length === 0) {
      return {
        success: false,
        message: await getTranslation(lang, "notFound"),
        data: [],
        total
      };
    }

    console.timeEnd("start");

    // Store in cache
    supplierCache.set(cacheKey, {
      data: existingSuppliers,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });

    const stats = supplierCache.getMemoryUsage();
    let cacheHits = 0, cacheMisses = 0;

    if (cached) cacheHits++;
    else cacheMisses++;

    return {
      success: true,
      message: await getTranslation(lang, "success"),
      data: existingSuppliers,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      cacheUsedMB: stats.usedMB.toFixed(2),
      cacheFreeMB: stats.freeMB.toFixed(2),
      cacheUsedPercent: stats.usedPercent.toFixed(2) + "%",
      cacheHits,
      cacheMisses
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error
        ? error.message
        : await getTranslation(lang, "serverErr")
    };
  }
};

// update
export const suppPut = async ({ body, headers, supplierId }: { body : suppTypes, headers: headTypes, supplierId: string}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try {

    // now extract
    let { company, contact } = body as suppTypes;

    // sanitize to remove xss
    company = sanitizeString(company.trim().toLowerCase());    
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
        .where(eq(suppliers.id, supplierId))
        .returning({ id: suppliers.id, company: suppliers.company, contact: suppliers.contact});

    if (!updateSupp) {
        return {
            success: false,
            message: await getTranslation(lang, "notFound")
        }
    }

    return {
        success: true,
        data: updateSupp,
        message: await getTranslation(lang, "update")
    }

    } catch (error) {
        return {
            success: false,
            message: error instanceof Error 
                    ? error.message
                    : await getTranslation(lang, "serverErr") 
        }
    }
}

// delete
export const suppDel = async ({ headers, supplierId, shopId }: {headers: headTypes, supplierId: string, shopId: string }) => {
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
        const suppDel = await mainDb.delete(suppliers)
                            .where(
                                and(
                                    eq(suppliers.id, supplierId),
                                    eq(suppliers.shopId, shopId)
                                )
                            );

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
                message: error instanceof Error 
                        ? error.message
                        : await getTranslation(lang, "serverErr") 
            }
        }
    }
} 
