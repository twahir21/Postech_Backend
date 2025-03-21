import { z } from "zod"
import type { headTypes, productTypes } from "../types/types";
import { getTranslation } from "./translation";

// implementing crud for products 
export const prodPost = async ({ body, headers }: {body: productTypes, headers: headTypes}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";

    try{
        // validating product data
        const schema = z.object({
            name: z.string().min(3, await(getTranslation(lang, "ProdNameErr"))),
            company: z.string().min(3, "Company name cannot have less than 3 characters"),
            priceBought: z.number().min(1, "Price bought cannot be less than 1"),
            priceSold: z.number().min(1, "Price sold cannot be less than 1"),
            stock: z.number().min(0, "Stock cannot be negative"),
            minStock: z.number().min(0, "Minimum stock can never be negative"),
            unit: z.string().min(1, "Unit can never have less than 1 character")
        });
    
        const parsed = schema.safeParse(body);
    
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.format()
            }
        }

        const {name, company, priceBought, priceSold, stock, minStock}: productTypes = parsed.data;
        
        // now save to database
        return {
            success: true,
            data: {name, company, priceBought, priceSold, stock, minStock}
        }
        
    }catch(error){
        if (error instanceof Error) {
            return {
                error: error.message,
                success: false
            }
        }else{
            return {
                error: await getTranslation(lang, "serverErr"),
                success: false
            }
        }
    }
}