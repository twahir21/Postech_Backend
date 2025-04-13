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
  try {
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
    const result = await mainDb.execute(sql`
      SELECT 
        p.id as productId,
        p.name as productName,
        
        COALESCE(s.totalSales, 0) AS totalSales,
        COALESCE(pur.totalCost, 0) AS totalCost,
        COALESCE(s.totalSales, 0) - COALESCE(pur.totalCost, 0) AS profit
    
      FROM products p
    
      LEFT JOIN (
        SELECT 
          s.product_id, 
          SUM(s.quantity * s.price_sold) AS totalSales
        FROM sales s
        WHERE s.shop_id = ${shopId}
        GROUP BY s.product_id
      ) s ON s.product_id = p.id
    
      LEFT JOIN (
        SELECT 
          pur.product_id, 
          SUM(pur.quantity * pur.price_bought) AS totalCost
        FROM purchases pur
        WHERE pur.shop_id = ${shopId}
        GROUP BY pur.product_id
      ) pur ON pur.product_id = p.id
    
      WHERE p.shop_id = ${shopId}
      ORDER BY profit DESC
    `);
    
    const profitPerProduct = result || []; // ✅ Proper array
    
    const totalProfitFromProducts = profitPerProduct.reduce((sum, item) => {
      return sum + Number(item.profit || 0);
    }, 0);

    const totalSalesFromProducts = profitPerProduct.reduce((sum, item) => {
      return sum + Number(item.totalsales || 0);
    }, 0);

    const totalPurchasesFromProducts = profitPerProduct.reduce((sum, item) => {
      return sum + Number(item.totalcost || 0);
    }, 0);
        
    const expenseResult = await mainDb.execute(sql`
      SELECT COALESCE(SUM(e.amount), 0) AS totalExpenses
      FROM expenses e
      WHERE e.shop_id = ${shopId}
    `);

    const totalExpenses = Number(expenseResult?.[0]?.totalexpenses || 0);
    
    const netProfit = {
      totalExpenses,
      totalSales: totalSalesFromProducts,
      totalPurchases: totalPurchasesFromProducts,
      netProfit: totalProfitFromProducts - totalExpenses
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
  } catch (error) {
    if (error instanceof Error) {
      console.error('🔥 /analytics error:', error);
      return {
        success: false,
        message: error.message || 'Unexpected error',
      };
    }else{
      return {
        success: false,
        message: "Analytics problems"
      }
    }
  }

});

export default analyticsRoute;
