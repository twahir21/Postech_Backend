import { z } from "zod"
import type { headTypes, productTypes } from "../types/types";
import { getTranslation } from "./translation";
import { sanitizeNumber, sanitizeString } from "./security/xss";

// implementing crud for products 
export const prodPost = async ({ body, headers }: {body: productTypes, headers: headTypes}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";

    try{
        // validating product data
        const schema = z.object({
            name: z.string().min(3, await getTranslation(lang, "ProdNameErr")),
            priceBought: z.number().min(1, await getTranslation(lang, "priceErr")),
            priceSold: z.number().min(1, await getTranslation(lang, "priceErr")),
            stock: z.number().min(0, await getTranslation(lang, "stockErr")),
            minStock: z.number().min(0, await getTranslation(lang, "stockErr")),
            unit: z.string().min(1, await getTranslation(lang, "unitErr"))
        });
    
        const parsed = schema.safeParse(body);
    
        if (!parsed.success) {
            return {
                success: false,
                messsage: parsed.error.format()
            }
        }

        let  {name, company, priceBought, priceSold, stock, minStock}: productTypes = parsed.data;

        // sanitize or remove xss scripts if available
        name = sanitizeString(name);
        company = sanitizeString(company);
        priceBought = sanitizeNumber(priceBought);
        priceSold = sanitizeNumber(priceSold);
        stock = sanitizeNumber(stock);
        minStock = sanitizeNumber(minStock);

        
        // now save to database
        return {
            success: true,
            data: {name, company, priceBought, priceSold, stock, minStock}
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