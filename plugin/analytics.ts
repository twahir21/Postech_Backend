// routes/profits.ts
import { Elysia } from 'elysia';
import { eq, and, sql, lte, asc } from 'drizzle-orm';
import jwt from '@elysiajs/jwt';
import { extractId } from '../functions/security/jwtToken';
import { getTranslation } from '../functions/translation';
import { mainDb } from '../database/schema/connections/mainDb';
import { products } from '../database/schema/shop';

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";


const analyticsRoute = new Elysia()
  .use(jwt({
      name: 'jwt',
      secret: JWT_SECRET,
  }))

  .get('/analytics', async ({ jwt, cookie, headers }) => {
    const { userId, shopId } = await extractId({ jwt, cookie });
    const lang: any = headers["accept-language"]?.split(",") || "sw";

    const token = cookie.auth_token?.value;
    if (!token) {
        throw new Error(`${await getTranslation(lang, "noToken")}`)
    }

    const decoded = await jwt.verify(token)
    if (!decoded) {
        throw new Error("Unauthorized -  invalid token ");
    }

    if (!shopId) {
      return {
        success: false,
        message: "Shop ID is required"
      };
    }

    // 🔹 Profit Per Product
    const profitPerProduct = await mainDb.execute(sql`
      SELECT 
        p.id as productId,
        p.name as productName,
        COALESCE(SUM(s.quantity * s.price_sold), 0) AS totalSales,
        COALESCE(SUM(pur.quantity * pur.price_bought), 0) AS totalCost,
        COALESCE(SUM(s.quantity * s.price_sold), 0) - COALESCE(SUM(pur.quantity * pur.price_bought), 0) AS profit
      FROM products p
      LEFT JOIN sales s ON s.product_id = p.id AND s.shop_id = ${shopId}
      LEFT JOIN purchases pur ON pur.product_id = p.id AND pur.shop_id = ${shopId}
      WHERE p.shop_id = ${shopId}
      GROUP BY p.id, p.name
      ORDER BY profit DESC
    `);

    // 🔹 Net Profit Summary
    const netProfitResult = await mainDb.execute(sql`
      SELECT 
        (SELECT COALESCE(SUM(s.quantity * s.price_sold), 0) FROM sales s WHERE s.shop_id = ${shopId}) AS totalSales,
        (SELECT COALESCE(SUM(p.quantity * p.price_bought), 0) FROM purchases p WHERE p.shop_id = ${shopId}) AS totalPurchases,
        (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.shop_id = ${shopId}) AS totalExpenses
    `);

    

    const net = netProfitResult[0];
    const netProfit = {
      totalSales: Number(net.totalSales),
      totalPurchases: Number(net.totalPurchases),
      totalExpenses: Number(net.totalExpenses),
      netProfit: Number(net.totalSales) - Number(net.totalPurchases) - Number(net.totalExpenses)
    };




  // lowest stock product
  const lowestProduct = await mainDb
  .select()
  .from(products)
  .where(and(
      eq(products.shopId, shopId),
      lte(products.stock, products.minStock)
  ))
  .orderBy(asc(products.stock))
  .limit(1);


  return {
    success: true,
    profitPerProduct,
    netProfit,
    lowestProduct
  };

});

export default analyticsRoute;
