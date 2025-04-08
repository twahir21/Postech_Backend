import { z } from "zod"
import type { headTypes, ProductQuery, productTypes, QrData } from "../types/types";
import { getTranslation } from "./translation";
import { sanitizeNumber, sanitizeString } from "./security/xss";
import { mainDb } from "../database/schema/connections/mainDb";
import { expenses, products, purchases, supplierPriceHistory } from "../database/schema/shop";
import { eq, ilike, sql } from "drizzle-orm";

const startTime = Date.now();
// implementing crud for products 
export const prodPost = async ({ body, headers, shopId, userId, supplierId, categoryId }: {body: productTypes, headers: headTypes, shopId: string, userId: string, categoryId: string, supplierId: string}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";

    try{
    // Fetch translations once instead of waiting inside the schema validation
    const prodNameErr = await getTranslation(lang, "ProdNameErr");
    const priceErr = await getTranslation(lang, "priceErr");
    const stockErr = await getTranslation(lang, "stockErr");
    const unitErr = await getTranslation(lang, "unitErr");

    // Validate product data
    const schema = z.object({
        name: z.string().min(3, prodNameErr),
        priceBought: z.number().min(1, priceErr),
        priceSold: z.number().min(1, priceErr),
        stock: z.number().min(0, stockErr),
        minStock: z.number().min(0, stockErr),
        unit: z.string().min(1, unitErr)
    });
    
        const parsed = schema.safeParse(body);
    
        if (!parsed.success) {
            return {
                success: false,
                message: parsed.error.format()
            }
        }



        let  {name, priceBought, priceSold, stock, minStock, unit} : productTypes = parsed.data;


        // sanitize or remove xss scripts if available
        name = sanitizeString(name);
        priceBought = sanitizeNumber(priceBought);
        priceSold = sanitizeNumber(priceSold);
        stock = sanitizeNumber(stock);
        minStock = sanitizeNumber(minStock);
        unit = sanitizeString(unit);

        const endTime = Date.now();
        const overallTime = `Time taken: ${endTime - startTime}ms`;

        // priceBought

        // now save to database to products
        const [insertedProduct] = await mainDb.insert(products).values({
            name,
            categoryId,
            priceSold: parseFloat(priceSold.toString()),
            stock,
            supplierId,
            shopId,
            minStock,
            unit,
          }).returning({ id: products.id });
          
          if (!insertedProduct) {
            throw new Error("Hakuna bidhaa kwa jina hili");
          }
          
          const productId = insertedProduct.id;



          if (!insertedProduct || !insertedProduct.id) {
            throw new Error("Hakuna bidhaa kwa jina hili");
          }


        // now save to purchases
        await mainDb.insert(purchases).values({
            supplierId,
            productId: productId,
            shopId,
            quantity: stock,
            priceBought,
            totalCost: priceBought * stock,
        });

        // insert supplier price history
        await mainDb.insert(supplierPriceHistory).values({
            supplierId,
            productId: productId,
            shopId,
            price: priceBought
        })

        return {
            success: true,
            data: {name, priceBought, priceSold, stock, minStock, shopId, userId, categoryId, supplierId, unit, overallTime},
            message: await getTranslation(lang, "productSuccess")
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


export const prodGet = async ({userId, shopId, query, set, headers}: {userId: string, shopId: string, query: ProductQuery, set: { status: number }, headers: headTypes}) => {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const search = query.search || '';
  
    const offset = (page - 1) * limit;

    const lang = headers["accept-language"]?.split(",")[0] || "sw";
  
    // Build filter condition
    const where = search
      ? ilike(products.name, `%${search}%`)
      : undefined;
  try {
    
    // Get total count
    const total = await mainDb
    .select({ count: sql<number>`count(*)` }) // ✅ sql<number> for type hint
    .from(products)
      .where(where || undefined)
      .then((rows) => Number(rows[0].count));
  
    // Get paginated products
    const rows = await mainDb
    .select({
      id: products.id,
      name: products.name,
      categoryId: products.categoryId,
      priceSold: products.priceSold,
      stock: products.stock,
      shopId: products.shopId,
      supplierId: products.supplierId,
      minStock: products.minStock,
      status: products.status,
      unit: products.unit,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      isQRCode: products.isQRCode,
      priceBought: purchases.priceBought, // 🎯 pulled via LEFT JOIN
    })
    .from(products)
    .leftJoin(purchases, eq(products.id, purchases.productId)) // left join to preserve products even without purchases
    .where(where)
    .orderBy(products.createdAt)
    .limit(limit)
    .offset(offset);
  
    if (rows.length === 0) {
        set.status = 204;
        return { success: false, data: [], total };
    }
  
    set.status = 200;
    return {
        success: true,
        data: rows.map((row) => ({
          ...row,
          priceSold: Number(row.priceSold),
          priceBought: row.priceBought !== null ? Number(row.priceBought) : null,
        })),
        total,
      };
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


export const prodDel = async ({userId, shopId, productId, headers}: {userId: string, shopId: string, productId: string, headers: headTypes}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try{
        // check if product exists
        const product = await mainDb
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .then((rows) => rows[0]);
    
        if (!product) {
            return {
                success: false,
                message: "Hakuna bidhaa kwa jina hili"
            }
        }
    
        // delete product
        await mainDb.delete(products).where(eq(products.id, productId));
    
        return {
            success: true,
            message: "Bidhaa imeondolewa kwa mafanikio"
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


export const prodUpdate = async ({userId, shopId, productId, body, headers}: {userId: string, shopId: string, productId: string, body: productTypes, headers: headTypes}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try{
    // Fetch translations once instead of waiting inside the schema validation
    const prodNameErr = await getTranslation(lang, "ProdNameErr");
    const priceErr = await getTranslation(lang, "priceErr");
    const stockErr = await getTranslation(lang, "stockErr");
    const unitErr = await getTranslation(lang, "unitErr");

    // Validate product data
    const schema = z.object({
        name: z.string().min(3, prodNameErr),
        priceBought: z.number().min(1, priceErr),
        priceSold: z.number().min(1, priceErr),
        stock: z.number().min(0, stockErr),
        minStock: z.number().min(0, stockErr),
        unit: z.string().min(1, unitErr)
    });
    
        const parsed = schema.safeParse(body);
    
        if (!parsed.success) {
            return {
                success: false,
                message: parsed.error.format()
            }
        }



        let  {name, priceBought, priceSold, stock, minStock, unit} : productTypes = parsed.data;


        // sanitize or remove xss scripts if available
        name = sanitizeString(name);
        priceBought = sanitizeNumber(priceBought);
        priceSold = sanitizeNumber(priceSold);
        stock = sanitizeNumber(stock);
        minStock = sanitizeNumber(minStock);
        unit = sanitizeString(unit);



        // check if product exists
        const product = await mainDb
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .then((rows) => rows[0]);
    
        if (!product) {
            return {
                success: false,
                message: "Hakuna bidhaa kwa jina hili"
            }
        }
    
        // update product
        const sanitizedStock = Math.max(0, stock);


        await mainDb.update(products).set({
            name,
            stock: sanitizedStock, // prevent negative stock
            minStock,
            unit,
            status: sanitizedStock <= 0 ? 'finished' : 'available', // auto-update status
            priceSold,
            updatedAt: new Date(),
            isQRCode: false
            
        }).where(eq(products.id, productId));

        // purchases
        await mainDb.update(purchases).set({
            quantity: sanitizedStock,
            priceBought,
            totalCost: priceBought * sanitizedStock,

        }).where(eq(purchases.productId, productId));

        await mainDb.update(supplierPriceHistory).set({
            price: priceBought
        }).where(eq(supplierPriceHistory.productId, productId));

        // set isQrCode to false
        await mainDb.update(products).set({
            isQRCode: false
        }).where(eq(products.id, productId));

        const updatedProduct = await mainDb
        .select({
            id: products.id,
            name: products.name,
            stock: products.stock,
            minStock: products.minStock,
            unit: products.unit,
            status: products.status,
            priceSold: products.priceSold,
            isQRCode: products.isQRCode,
            updatedAt: products.updatedAt,
            priceBought: purchases.priceBought, // 👈 include from purchases
        })
        .from(products)
        .leftJoin(purchases, eq(products.id, purchases.productId))
        .where(eq(products.id, productId))
        .limit(1)
        .then(rows => rows[0]);
        
        if (!updatedProduct) {
            throw new Error("Hakuna bidhaa kwa jina hili");
          }
    
        return {
            success: true,
            data: updatedProduct,
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

export const QrPost = async({ body, headers, userId, shopId }: { body: QrData, headers: headTypes, userId: string, shopId: string }) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";

    try{
    // Fetch translations once instead of waiting inside the schema validation
    const prodNameErr = await getTranslation(lang, "ProdNameErr");
    const priceErr = await getTranslation(lang, "priceErr");
    const stockErr = await getTranslation(lang, "stockErr");
    const unitErr = await getTranslation(lang, "unitErr");
    
    // Validate product data
    const schema = z.object({
        calculatedTotal: z.number().min(0, "Jumla haiwezi kuwa chini ya 0"),
        quantity: z.number().min(0, "Kiasi hakiwezi kuwa chini ya 0"),
        saleType: z.string().min(3, "Haiwezi kuwa chini ya herufi 3"),
        discount: z.number().min(-1, "Punguzo haliwezi kuwa chini ya 0"),
        description: z.string().min(3, "Maelezo hayawezi kuwa chini ya herufi 3"),
        typeDetected: z.string().min(3, "Chaguo haliwezi kuwa na herufi chini ya 3"),
        productId: z.string().min(5, "Id haiwezi kuwa na herufi chini ya 5")
    });
        
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        return {
            success: false,
            message: parsed.error.format()
        }
    }


    let  { calculatedTotal, quantity, saleType, discount, description, typeDetected, productId } : QrData = parsed.data;


    // sanitize or remove xss scripts if available
    saleType = sanitizeString(saleType);
    calculatedTotal = sanitizeNumber(calculatedTotal);
    quantity = sanitizeNumber(quantity);
    discount = sanitizeNumber(discount);
    typeDetected = sanitizeString(typeDetected);
    description = sanitizeString(description);
    productId = sanitizeString(productId);


    // switch 
    switch(typeDetected){
        case 'expenses':
            // save to expenses 
            await mainDb.insert(expenses).values({
                description,
                amount: calculatedTotal,
                shopId
            });

            return {
                success: true,
                message: "Matumizi yamehifadhiwa kikamilifu"
            }

        case 'sales':
            console.log("Sales detected")
        break;

        case 'purchases':
            console.log("Purchases detected")
        break;

        default:
            console.log("Invalid Data!")
    }
    

    return {
        success: true,
        message: "Nice implementations"
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