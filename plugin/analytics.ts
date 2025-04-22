// routes/profits.ts
import { Elysia } from 'elysia';
import { eq, and, sql, lte, asc, desc } from 'drizzle-orm';
import jwt from '@elysiajs/jwt';
import { extractId } from '../functions/security/jwtToken';
import { getTranslation } from '../functions/translation';
import { mainDb } from '../database/schema/connections/mainDb';
import { customers, debts, expenses, products, sales, shops, users } from '../database/schema/shop';
import { formatDistanceToNow } from "date-fns";
import { z } from 'zod';
import { sanitizeString } from '../functions/security/xss';


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
    const result = await mainDb.execute (sql`
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
    
    const profitPerProduct = result.rows || [];
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

    const totalExpenses = Number(expenseResult.rows?.[0]?.totalexpenses || 0);
    
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


  
  // sales in a week 
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6); // Last 7 days
  
  // --- SALES ---
  const salesResult = await mainDb.execute(
    sql`
      SELECT 
        TO_CHAR(created_at, 'Dy') AS day, 
        SUM(total_sales) AS sales
      FROM sales
      WHERE shop_id = ${shopId} AND created_at >= ${startDate.toISOString()}
      GROUP BY day
      ORDER BY MIN(created_at)
    `
  );
  
  // --- EXPENSES ---
  const expensesResult = await mainDb.execute(
    sql`
      SELECT 
        TO_CHAR(date, 'Dy') AS day, 
        SUM(amount) AS expenses
      FROM expenses
      WHERE shop_id = ${shopId} AND date >= ${startDate.toISOString()}
      GROUP BY day
      ORDER BY MIN(date)
    `
  );
  
  // --- PURCHASES ---
  const purchasesResult = await mainDb.execute(
    sql`
      SELECT 
        TO_CHAR(created_at, 'Dy') AS day, 
        SUM(quantity * price_bought) AS purchases
      FROM purchases
      WHERE shop_id = ${shopId} AND created_at >= ${startDate.toISOString()}
      GROUP BY day
      ORDER BY MIN(created_at)
    `
  );
  
  // Create a map to align days and avoid missing entries
  const daysMap = new Map<string, { sales: number, expenses: number, purchases: number }>();
  
  // Helper to init day entry if not exists
  function ensureDay(day: string) {
    if (!daysMap.has(day)) {
      daysMap.set(day, { sales: 0, expenses: 0, purchases: 0 });
    }
  }
  
  // Process sales
  type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

  for (const row of salesResult.rows) {
    const day = row.day as Weekday;
    ensureDay(day);
    daysMap.get(day)!.sales = Number(row.sales || 0);
  }
  
  // Process expenses
  for (const row of expensesResult.rows) {
    const day = row.day as Weekday;
    ensureDay(day);
    daysMap.get(day)!.expenses = Number(row.expenses || 0);
  }
  
  // Process purchases
  for (const row of purchasesResult.rows) {
    const day = row.day as Weekday;
    ensureDay(day);
    daysMap.get(day)!.purchases = Number(row.purchases || 0);
  }
  
  // Final Output
  const rawSalesByDay = [];
  const expensesByDay = [];
  const purchasesPerDay = [];
  const salesByDay = [];
  
  for (const [day, data] of daysMap.entries()) {
    rawSalesByDay.push({ day, sales: data.sales });
    expensesByDay.push({ day, expenses: data.expenses });
    purchasesPerDay.push({ day, purchases: data.purchases });
  
    const netSales = data.sales - data.expenses - data.purchases;
    salesByDay.push({ day, netSales });
  }
  

  return {
    success: true,
    profitPerProduct,
    highestProfitProduct,
    netProfit,
    lowestProduct,
    lowStockProducts,
    mostSoldProductByQuantity: mostSoldByQuantity.rows?.[0] || null,
    mostFrequentProduct: mostFrequentSales.rows?.[0] || null,
    longTermDebtUser: longTermDebtUser || null,
    mostDebtUser: mostDebtUser || null,
    daysSinceDebt,
    salesByDay,
    expensesByDay,
    rawSalesByDay,
    purchasesPerDay
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

  })


  .get('/sales', async ({ jwt, cookie, headers }) => {
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

      // get the concept of sales needed data
    } catch (error) {
      if (error instanceof Error) {
        console.error('🔥 /Sales error:', error);
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
  })

  .get("/shop", async ({ jwt, cookie, headers }) => {
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

      // get the concept of shop needed data
      const fetchShop = await mainDb.select({ shopName: shops.name }).from(shops).where(eq(shops.id, shopId));
      const fetchEmail = await mainDb.select({ email: users.email }).from(users).where(eq(users.id, userId));


      if (fetchShop.length === 0 || fetchEmail.length === 0) {
        return {
          success: false,
          message: "Hakuna kilichopatikana"
        }
      }

      return {
        success: true,
        shopName: fetchShop[0],
        email: fetchEmail[0]
      }



    } catch (error) {
      if (error instanceof Error) {
        console.error('🔥 /Shop error:', error);
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
  })

  .put("/shop", async ({ jwt, cookie, headers, body }) => {
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

      // get the concept of shop needed data
      const schema = z.object({
        email: z.string().email(),
        shopName: z.string().min(3, "Hakuna jina chini ya herufi tatu")
      });

      interface shopTypes {
        email?: string;
        shopName?: string;
      }

      const safeParse = schema.safeParse(body);

      if (!safeParse.success) {
        return {
          success: false,
          message: safeParse.error.format()
        }
      }

      let { email, shopName } = safeParse.data as shopTypes;

      email = sanitizeString(email);
      shopName = sanitizeString(shopName);

      console.log(email, shopName);

      // give the logic of saving to database
      await mainDb.update(users).set({
        email
      }).where(eq(users.id, userId));

      await mainDb.update(shops).set({
        name: shopName
      }).where(eq(shops.id, shopId));


    } catch (error) {
      if (error instanceof Error) {
        console.error('🔥 /Shop error:', error);
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
  })

  .get('/fetch-password', ({}) => {

  })

  .put("/update-password", ({}) => {

  })

  .delete("/delete-shop", ({}) => {

  })

export default analyticsRoute;
