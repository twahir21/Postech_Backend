// routes/profits.ts
import { Elysia } from 'elysia';
import { eq, and, sql, lte, asc, desc, ilike, gte } from 'drizzle-orm';
import jwt from '@elysiajs/jwt';
import deleteAuthTokenCookie, { extractId } from '../functions/security/jwtToken';
import { getTranslation } from '../functions/translation';
import { mainDb } from '../database/schema/connections/mainDb';
import { askedProducts, categories, customers, debtPayments, debts, expenses, products, purchases, returns, sales, shops, shopUsers, supplierPriceHistory, suppliers, users } from '../database/schema/shop';
import { formatDistanceToNow } from "date-fns";
import { z } from 'zod';
import { sanitizeString } from '../functions/security/xss';
import { hashPassword, verifyPassword } from '../functions/security/hash';


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
  const salesByDay = [];
  const expensesByDay = [];
  const purchasesPerDay = [];
  const netSalesByDay = [];
  
  for (const [day, data] of daysMap.entries()) {
    salesByDay.push({ day, sales: data.sales });
    expensesByDay.push({ day, expenses: data.expenses });
    purchasesPerDay.push({ day, purchases: data.purchases });
  
    const netSales = data.sales - data.expenses - data.purchases;
    netSalesByDay.push({ day, netSales });
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
    netSalesByDay,
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


  .get('/sales', async ({ jwt, cookie, headers, query }) => {
    try {
      // Extract user and shop IDs from JWT or cookies
      const { userId, shopId } = await extractId({ jwt, cookie });
      const lang: any = headers["accept-language"]?.split(",") || "sw";
  
      const token = cookie.auth_token?.value;
      if (!token) {
        throw new Error(`${await getTranslation(lang, "noToken")}`);
      }
  
      const decoded = await jwt.verify(token);
      if (!decoded) {
        throw new Error("Unauthorized - invalid token");
      }
  
      if (!shopId) {
        return {
          success: false,
          message: "Shop ID is required",
        };
      }
  
      // Extract query parameters or set defaults
      const {
        search = '',
        date = 'Leo',  // Default to 'Leo' if not provided
        from = '',
        to = '',
        page = '1',
        limit = '10',
      } = query;

      console.log(`
        search: ${search}, date is ${date}, 
        from ${from} to ${to} with page ${page} and limit of ${limit}
      `);
  
      const pageNum = parseInt(page as string) || 1;
      const perPage = parseInt(limit as string) || 10;
      const offset = (pageNum - 1) * perPage;
  
      // Initialize filters array
      const filters = [];
  
      // Ensure shop filter is always applied
      filters.push(eq(sales.shopId, shopId));
  
      // Handle search query
      const searchTrimmed = (search as string).trim();

      if (searchTrimmed) {
        filters.push(ilike(customers.name, `%${searchTrimmed}%`));
      }

  
      // Handle date filtering (today, week, month, or custom)
      if (date && date !== 'Tarehe_maalumu') {
        const today = new Date();
        let start: Date, end: Date;
  
        switch (date) {
          case 'Leo':
            start = new Date(today.toDateString());
            end = new Date(start);
            end.setDate(end.getDate() + 1);
            break;
          case 'Wiki_hii':
            start = new Date(today);
            start.setDate(start.getDate() - 7);
            end = today;
            break;
          case 'Mwezi_huu':
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = today;
            break;
          case 'Jana': 
            start = new Date(today);
            start.setDate(today.getDate() - 1);
            end = new Date(start);
            break;
          default:
            start = end = today;
        }
  
        filters.push(and(gte(sales.createdAt, start), lte(sales.createdAt, end)));
      }
  
      // Handle custom date range filtering
      if (date === 'custom' && from && to) {
        filters.push(and(gte(sales.createdAt, new Date(from)), lte(sales.createdAt, new Date(to))));
      }
  
  
      // Construct where clause from filters
      const whereClause = filters.length ? and(...filters) : undefined;
  
      // Get total count of sales matching the filters
      const totalResult = await mainDb
        .select({ count: sql<number>`COUNT(*)` })
        .from(sales)
        .leftJoin(customers, eq(sales.customerId, customers.id))
        .where(whereClause);
  
      const total = totalResult[0].count;
  
      // Get the sales data based on filters, pagination, and ordering
      const results = await mainDb
        .select({
          date: sales.createdAt,
          name: products.name,
          total: sales.totalSales,
          paymentType: sales.saleType,
          customer: sql<string>`COALESCE(${customers.name}, 'mteja')`.as('customer')
        })
        .from(sales)
        .leftJoin(customers, eq(sales.customerId, customers.id))
        .leftJoin(products, eq(sales.productId, products.id))
        .where(whereClause)
        .limit(perPage)
        .offset(offset)
        .orderBy(desc(sales.createdAt));
  
      // Test query without filters for debugging (no where clause)
      const resultsTest = await mainDb
        .select({
          id: sales.id,
          date: sales.createdAt,
          paymentType: sales.saleType,
          customer: sql<string>`COALESCE(${customers.name}, 'anonymous')`.as('customer'),
        })
        .from(sales)
        .leftJoin(customers, eq(sales.customerId, customers.id))
        .orderBy(desc(sales.createdAt))
        .limit(10);
  

      // Return the sales data and total count
      return {
        sales: results,
        total,
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error('🔥 /Sales error:', error);
        return {
          success: false,
          message: error.message || 'Unexpected error',
        };
      } else {
        return {
          success: false,
          message: "Analytics problems",
        };
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


      // give the logic of saving to database
      await mainDb.update(users).set({
        email
      }).where(eq(users.id, userId)).returning();

      await mainDb.update(shops).set({
        name: shopName
      }).where(eq(shops.id, shopId)).returning();


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

  .put("/update-password", async ({ jwt, cookie, headers, body }) => {
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

      // get the concept of updating password
      const schema = z.object({
        currentPassword: z.string().min(6, "Nenosiri haliwezi kuwa na herufi chini ya 6"),
        newPassword: z.string().min(6, "Nenosiri haliwezi kuwa na herufi chini ya 6"),
      });

      const safeData = schema.safeParse(body);

      if (!safeData.success){
        return {
          success: false,
          message: safeData.error.format()
        }
      }

      interface pswdType {
        currentPassword?: string;
        newPassword?: string;
      }

      let { currentPassword, newPassword } = safeData.data as pswdType;

      // sanitize
      currentPassword = sanitizeString(currentPassword);
      newPassword = sanitizeString(newPassword);

      const res = await mainDb.select({ pswd: users.password }).from(users).where(eq(users.id, userId));

      const fetchedPswd = res[0].pswd;

      const isVerified = await verifyPassword(fetchedPswd, currentPassword);

      if(!isVerified) {
        return {
          success: false,
          message: "Nenosiri la zamani sio sahihi, jaribu tena"
        }
      }

      // hash new password and save
      const hashedNewPassword = await hashPassword(newPassword);

      await mainDb.update(users)
      .set({
        password: hashedNewPassword
      })
      .where(eq(users.id, userId))
      .returning();


      return {
        success: true,
        message: "Umefanikiwa kubadili nenosiri, tafadhali itunze"
      }


    } catch (error) {
      if (error instanceof Error) {
        console.error('🔥 /Update-password error:', error);
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

  .delete("/delete-shop", async ({ jwt, cookie, headers }) => {
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

      // ensure user is Admin 
      const isAdminCheck = await mainDb.select({role: users.role}).from(users).where(eq(users.id, userId));

      const isAdmin = isAdminCheck[0].role;


      if(isAdmin !== 'owner'){
        return {
          success: false,
          message: "Hauna mamlaka ya kufuta duka"
        }
      }

      // // get the concept of deleting shop
      await mainDb.delete(products).where(eq(products.shopId, shopId));
      await mainDb.delete(sales).where(eq(sales.shopId, shopId));
      await mainDb.delete(debts).where(eq(debts.shopId, shopId));
      await mainDb.delete(debtPayments).where(eq(debtPayments.shopId, shopId));
      await mainDb.delete(purchases).where(eq(purchases.shopId, shopId));
      await mainDb.delete(expenses).where(eq(expenses.shopId, shopId));
      await mainDb.delete(returns).where(eq(returns.shopId, shopId));
      await mainDb.delete(askedProducts).where(eq(askedProducts.shopId, shopId));
      await mainDb.delete(supplierPriceHistory).where(eq(supplierPriceHistory.shopId, shopId));
      await mainDb.delete(suppliers).where(eq(suppliers.shopId, shopId));
      await mainDb.delete(customers).where(eq(customers.shopId, shopId));
      await mainDb.delete(categories).where(eq(categories.shopId, shopId));
      await mainDb.delete(shopUsers).where(eq(shopUsers.shopId, shopId));
      await mainDb.delete(shops).where(eq(shops.id, shopId));
      
      // Delete orphaned users
      await mainDb.execute(sql`
        DELETE FROM users 
        WHERE id IN (
          SELECT users.id FROM users
          LEFT JOIN shop_users ON users.id = shop_users.user_id
          WHERE shop_users.id IS NULL
        );
      `);
      

      // delete the coookie
      await deleteAuthTokenCookie(cookie);

      
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

  .get('/export-sales', async ({ jwt, cookie, headers, set }) => {
    try {
      const { userId, shopId } = await extractId({ jwt, cookie });
      const lang: any = headers["accept-language"]?.split(",") || "sw";
  
      const token = cookie.auth_token?.value;
      if (!token) {
        throw new Error(`${await getTranslation(lang, "noToken")}`)
      }
  
      const decoded = await jwt.verify(token);
      if (!decoded) {
        throw new Error("Unauthorized - invalid token");
      }
  
      if (!shopId) {
        return {
          success: false,
          message: "Shop ID is required"
        };
      }
  
      // 🔥 Fetch sales for this shop
      const salesData = await mainDb
        .select({
          date: sales.createdAt,
          productName: products.name,
          total: sales.totalSales,
          paymentType: sales.saleType,
          customer: sql<string>`COALESCE(${customers.name}, 'mteja')`.as('customer')
        })
        .from(sales)
        .leftJoin(customers, eq(sales.customerId, customers.id))
        .leftJoin(products, eq(sales.productId, products.id))
        .where(eq(sales.shopId, shopId))
        .orderBy(desc(sales.createdAt));
  
      // 🔥 Build CSV manually
      const csvHeader = "Date,Product Name,Total,Payment Type,Customer\n";
      const csvRows = salesData.map(row => {
        const dateObj = new Date(row.date);
        const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}:${String(dateObj.getSeconds()).padStart(2, '0')}`;
            
        return `${formattedDate},"${row.productName}",${row.total},${row.paymentType},"${row.customer}"`;
      });
      const csvContent = csvHeader + csvRows.join("\n");
  
      // 🔥 Set headers for file download
      set.headers = {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="Mauzo.csv"',
      };
  
      return new Response(csvContent);
  
    } catch (error) {
      if (error instanceof Error) {
        console.error('🔥 /Export sales error:', error);
        return {
          success: false,
          message: error.message || 'Unexpected error',
        };
      } else {
        return {
          success: false,
          message: "Export sales problems"
        };
      }
    }
  })

  .get("/graph", async ({ jwt, cookie, headers }) => {
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

      // get the concept of graphs

      // 1. total stocks in a week
      const stocksByDay = await mainDb
      .select({
        day: sql`TO_CHAR(${products.createdAt}, 'Dy')`.as('day_of_week'),
        totalStock: sql`SUM(${products.stock})`.as('total_stock'),
      })
      .from(products)
      .where(eq(products.shopId, shopId))
      .groupBy(sql`day_of_week`)
      .orderBy(sql`day_of_week`);

      //2. Expenses by a week
      const expensesByDay = await mainDb
      .select({
        day: sql`TO_CHAR(${expenses.createdAt}, 'Dy')`.as ('day_of_week'),
        totalExpenses: sql`SUM(${expenses.amount})` .as('total_expenses')
      })
      .from(expenses)
      .where(eq(expenses.shopId, shopId))
      .groupBy(sql`day_of_week`)
      .orderBy(sql`day_of_week`)

      //3. Purchases by a week
      const purchasesByDay = await mainDb
      .select({
        day: sql`TO_CHAR(${purchases.createdAt}, 'Dy')`.as ('day_of_week'),
        totalPurchases: sql`SUM(${purchases.priceBought} * ${purchases.quantity})` .as('total_purchases')
      })
      .from(purchases)
      .where(eq(purchases.shopId, shopId))
      .groupBy(sql`day_of_week`)
      .orderBy(sql`day_of_week`)

      //2. Debtusers by a week
      const DebtsByCustomer = await mainDb
      .select({
        customerName: customers.name,
        totalDebts: sql`SUM(${debts.remainingAmount})`.as('total_debts'),
      })
      .from(debts)
      .innerJoin(customers, eq(debts.customerId, customers.id))
      .where(eq(debts.shopId, shopId))
      .groupBy(customers.name)
      .orderBy(sql`total_debts DESC`);

      //4. total sales and debts
    

      console.log(stocksByDay, expensesByDay, purchasesByDay, DebtsByCustomer);

      return {
        success: true,
        stocksByDay,
        expensesByDay,
        purchasesByDay,
        DebtsByCustomer
      }



    } catch (error) {
      if (error instanceof Error) {
        console.error('🔥 /Graph error:', error);
        return {
          success: false,
          message: error.message || 'Unexpected error',
        };
      }else{
        return {
          success: false,
          message: "Graphs problems"
        }
      }
    }
  })
  


export default analyticsRoute;
