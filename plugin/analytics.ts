// routes/profits.ts
import { Elysia } from 'elysia';
import { eq, and, sql, lte, asc, desc } from 'drizzle-orm';
import jwt from '@elysiajs/jwt';
import { extractId } from '../functions/security/jwtToken';
import { getTranslation } from '../functions/translation';
import { mainDb } from '../database/schema/connections/mainDb';
import { customers, debts, products } from '../database/schema/shop';
import { formatDistanceToNow } from "date-fns";


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
    const highestProfitProduct = profitPerProduct[0] || null;

    
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

  const lowStockProducts = await mainDb
  .select()
  .from(products)
  .where(and(
    eq(products.shopId, shopId),
    lte(products.stock, products.minStock)
  ))
  .orderBy(asc(products.stock)); // Optional: order from lowest to highest

  const mostFrequentSales = await mainDb.execute(sql`
    SELECT 
      p.id AS productId,
      p.name AS productName,
      COUNT(s.id) AS timesSold
    FROM sales s
    INNER JOIN products p ON s.product_id = p.id
    WHERE s.shop_id = ${shopId}
    GROUP BY p.id, p.name
    ORDER BY timesSold DESC
    LIMIT 1
  `);

  const mostSoldByQuantity = await mainDb.execute(sql`
    SELECT 
      p.id AS productId,
      p.name AS productName,
      SUM(s.quantity) AS totalQuantitySold
    FROM sales s
    INNER JOIN products p ON s.product_id = p.id
    WHERE s.shop_id = ${shopId}
    GROUP BY p.id, p.name
    ORDER BY totalQuantitySold DESC
    LIMIT 1
  `);

  const [longTermDebtUser] = await mainDb
  .select({
    debtId: debts.id,
    customerId: debts.customerId,
    remainingAmount: debts.remainingAmount,
    createdAt: debts.createdAt,
    name: customers.name, // optional: get customer name
  })
  .from(debts)
  .where(eq(debts.shopId, shopId))
  .innerJoin(customers, eq(customers.id, debts.customerId))
  .orderBy(asc(debts.createdAt)) // oldest first
  .limit(1); // ⏳ Longest unpaid debt

  let daysSinceDebt = "Haijulikani"; // Default fallback

  if (longTermDebtUser?.createdAt) {
    const rawDate = new Date(longTermDebtUser.createdAt);
    
    // Safely adjust for UTC-3
    rawDate.setHours(rawDate.getHours() - 3); // For East Africa
  
    daysSinceDebt = formatDistanceToNow(rawDate, {
      addSuffix: true,
    });
  }
  



const [mostDebtUser] = await mainDb
  .select({
    debtId: debts.id,
    customerId: debts.customerId,
    remainingAmount: debts.remainingAmount,
    createdAt: debts.createdAt,
    name: customers.name,
  })
  .from(debts)
  .where(eq(debts.shopId, shopId))
  .innerJoin(customers, eq(customers.id, debts.customerId))
  .orderBy(desc(debts.remainingAmount)) // 💰 Highest remaining debt first
  .limit(1);


  
  


  return {
    success: true,
    profitPerProduct,
    highestProfitProduct,
    netProfit,
    lowestProduct,
    lowStockProducts,
    mostSoldProductByQuantity: mostSoldByQuantity?.[0] || null,
    mostFrequentProduct: mostFrequentSales?.[0] || null,
    longTermDebtUser: longTermDebtUser || null,
    mostDebtUser: mostDebtUser || null,
    daysSinceDebt
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
