import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { mainDb } from "../database/schema/connections/mainDb";
import { products, sales } from "../database/schema/shop";
import { eq, sql } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";

const automateTasks = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET
    }))
    .get("/scan-qrcode", async({ jwt, cookie, query}) => {
        const token = cookie.auth?.value;
        if (!token) {
            throw new Error("Unauthorized - no token");
        }

        const decoded = await jwt.verify(token);

        if(!decoded) {
            throw new Error("Unauthorized - Invalid Token!")
        }

        // defining queries from the link  
        const { priceSold, shopId, productId, userId, quantity, saleType, discount, customerId, description, amount} = query;

        // implement switch
        const normalizedSaleType = saleType.trim().toLowerCase(); // Ensure consistency by removing spaces and convert to lowercase

        switch (normalizedSaleType) {
            case "cash":
                // ✅ Logic for cash sales (update sales table & stock)
                await mainDb.insert(sales).values({
                    productId,
                    quantity,
                    discount,
                    shopId,
                    priceSold: parseFloat(priceSold.toString()),
                    saleType,
                    customerId
                });

                // now update stock
                await mainDb.update(products)
                .set({
                  stock: sql`GREATEST(${products.stock} - ${quantity}, 0)`// ✅ Perform subtraction using SQL
                })
                .where(eq(products.id, productId));

                break;
        
            case "debt":
                // ✅ Logic for debt sales (update debts table, sales, and stock)
                break;
        
            case "restocking":
                // ✅ Logic for restocking (update stock and expenses)
                break;
        
            default:
                throw new Error(`Invalid saleType provided: "${saleType}"`);
        }

        return {
            success: true,
            message: "Success"
        }
        

    });

export default automateTasks