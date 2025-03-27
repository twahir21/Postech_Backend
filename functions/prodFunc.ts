import { z } from "zod"
import type { headTypes, productTypes } from "../types/types";
import { getTranslation } from "./translation";
import { sanitizeNumber, sanitizeString } from "./security/xss";
import { mainDb } from "../database/schema/connections/mainDb";
import { products } from "../database/schema/shop";
import { generateQRCodeWithLogo } from "./qrCodeFunc";

const startTime = Date.now();
// implementing crud for products 
export const prodPost = async ({ body, headers, shopId, userId, categoryId, supplierId}: {body: productTypes, headers: headTypes, shopId: string, userId: string, categoryId: string, supplierId: string}) => {
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
                messsage: parsed.error.format()
            }
        }

        let  {name, priceBought, priceSold, stock, minStock, unit}: productTypes = parsed.data;


        // sanitize or remove xss scripts if available
        name = sanitizeString(name);
        priceBought = sanitizeNumber(priceBought);
        priceSold = sanitizeNumber(priceSold);
        stock = sanitizeNumber(stock);
        minStock = sanitizeNumber(minStock);
        unit = sanitizeString(unit);

        const endTime = Date.now();
        const overallTime = `Time taken: ${endTime - startTime}ms`;

        // now save to database
        await mainDb.insert(products).values({
            name,
            categoryId,
            priceBought,
            priceSold,
            stock, 
            supplierId,
            shopId,
            minStock, 
            unit
        });

        return {
            success: true,
            data: {name, priceBought, priceSold, stock, minStock, shopId, userId, categoryId, supplierId, unit, overallTime},
            message: 'Success'
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


export const prodGet = ({userId, shopId}: any) => {
    return {
        shopId, 
        userId
    }
}