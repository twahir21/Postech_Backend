import { z } from "zod"
import type { headTypes, productTypes } from "../types/types";
import { getTranslation } from "./translation";
import { sanitizeNumber, sanitizeString } from "./security/xss";
import { mainDb } from "../database/schema/connections/mainDb";
import { products, purchases, supplierPriceHistory } from "../database/schema/shop";
import { eq } from "drizzle-orm";

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
            priceSold,
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


export const prodGet = ({userId, shopId}: {userId: string, shopId: string}) => {
    return {
        shopId, 
        userId
    }
}