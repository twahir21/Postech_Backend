import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { mainDb } from "../database/schema/connections/mainDb";
import { debts, debtPayments, products, purchases, sales } from "../database/schema/shop";
import { eq, sql } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";

const automateTasks = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET
    }))
    .get("/scan-qrcode", async ({ query }) => {
        try {
                   // Extract & parse values
        const {
            priceSold, shopId, productId, userId, quantity, saleType,
            discount, customerId, description, amount, supplierId, priceBought
        } = query;

        // Convert to numbers to avoid SQL errors
        const parsedQuantity = Number(quantity);
        const parsedPriceSold = Number(priceSold);
        const parsedPriceBought = Number(priceBought || 0);
        const parsedDiscount = Number(discount || 0);

        if (isNaN(parsedQuantity) || parsedQuantity <= 0) throw new Error("Invalid quantity");
        if (isNaN(parsedPriceSold) || parsedPriceSold <= 0) throw new Error("Invalid priceSold");

        const normalizedSaleType = saleType.trim().toLowerCase(); // Normalize case

        switch (normalizedSaleType) {
            case "cash":
                // ✅ Insert into sales table
                await mainDb.insert(sales).values({
                    productId,
                    quantity: parsedQuantity,
                    discount: parsedDiscount,
                    shopId,
                    priceSold: parsedPriceSold,
                    totalSales: sql`${parsedQuantity} * ${parsedPriceSold}`, // ✅ Fixed
                    saleType,
                    customerId
                });

                // ✅ Update product stock (ensure it doesn't go negative)
                await mainDb.update(products)
                    .set({
                        stock: sql`GREATEST(${products.stock} - ${parsedQuantity}, 0)`
                    })
                    .where(eq(products.id, productId));

                break;

            case "debt":
                if (!customerId) throw new Error("Customer ID is required for debt sales.");

                // ✅ Insert into debts table
                const [{ id: debtId }] = await mainDb.insert(debts)
                    .values({
                        customerId,
                        totalAmount: sql`${parsedQuantity} * ${parsedPriceSold}`,
                        remainingAmount: sql`${parsedQuantity} * ${parsedPriceSold}`,
                        shopId
                    })
                    .returning({ id: debts.id });

                // ✅ Insert into sales table (to track the sale)
                await mainDb.insert(sales).values({
                    productId,
                    quantity: parsedQuantity,
                    discount: parsedDiscount,
                    shopId,
                    priceSold: parsedPriceSold,
                    totalSales: sql`${parsedQuantity} * ${parsedPriceSold}`,
                    saleType: "debt",
                    customerId
                });

                break;

            case "purchases":
                if (!supplierId || !parsedPriceBought) throw new Error("Missing supplierId or priceBought for purchase");

                // ✅ Insert into purchases table
                await mainDb.insert(purchases).values({
                    productId,
                    supplierId,
                    shopId,
                    quantity: parsedQuantity,
                    priceBought: parsedPriceBought,
                    totalCost: sql`${parsedPriceBought} * ${parsedQuantity}`,
                });

                // ✅ Update product stock (restock)
                await mainDb.update(products)
                    .set({
                        stock: sql`${products.stock} + ${parsedQuantity}`
                    })
                    .where(eq(products.id, productId));

                break;

            default:
                throw new Error(`Invalid saleType provided: "${saleType}"`);
        }

        return {
            success: true,
            message: "Success"
        }; 
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error
                        ? error.message
                        : "Seva imeshindwa kutoa majibu ya scan-QRCode"
            }
        }
    });

export default automateTasks;
