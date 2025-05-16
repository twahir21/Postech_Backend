import { eq, and, sql, lte, asc, desc, ilike, gte } from 'drizzle-orm';
import { getTranslation } from '../functions/translation';
import { mainDb } from '../database/schema/connections/mainDb';
import { askedProducts, categories, customers, debtPayments, debts, expenses, products, purchases, returns, sales, shops, shopUsers, supplierPriceHistory, suppliers, users } from '../database/schema/shop';
import { formatDistanceToNow } from "date-fns";
import type { exportSet, headTypes, ProductQuery, SalesQuery } from '../types/types';


export const getAnalytics = async ({ userId, shopId, headers }: { userId: string, shopId: string, headers: headTypes}) => {
        const lang = headers["accept-language"]?.split(",")[0] || "sw";
    
      try {
    
    
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
        console.log("Data: ", data.sales)
        expensesByDay.push({ day, expenses: data.expenses });
        purchasesPerDay.push({ day, purchases: data.purchases });
      
        const netSales = data.sales - data.expenses - data.purchases;
        netSalesByDay.push({ day, netSales });
      }

      console.log(salesByDay.length)
      
    
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
        return {
          success: false,
          message: error instanceof Error
                  ? error.message
                  : await getTranslation(lang, "serverErr")
        }    
      }
}

export const salesAnalytics = async ({ userId, shopId, headers, query}: {userId: string, shopId: string, headers: headTypes, query: SalesQuery}) => {
        const lang = headers["accept-language"]?.split(",")[0] || "sw";
        try {
          // Extract user and shop IDs from JWT or cookies
    
      
          // Extract query parameters or set defaults
          const {
            search = '',
            date = 'Leo',  // Default to 'Leo' if not provided
            from = '',
            to = '',
            page = '1',
            limit = '10',
          } = query;
    
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
            today.setHours(today.getHours() + 3);  // Add +3 to UTC -> EAT for East Africa
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
                end.setDate(end.getDate() + 1);  // **⚡You missed this line in your 'Jana'**
                break;
              default:
                start = end = today;
            }
      
            filters.push(and(gte(sales.createdAt, start), lte(sales.createdAt, end)));
          }
      
          // Handle custom date range filtering
          if (date === 'tarehe_maalumu' && from && to) {
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
    
    
          // Return the sales data and total count
          return {
            sales: results,
            total,
          };
        } catch (error) {
          return {
            success: false,
            message: error instanceof Error
                    ? error.message
                    : await getTranslation(lang, "serverErr")
          }
        }
}

export const exportSales = async ({userId, shopId, headers, set } : { shopId: string, userId: string, headers: headTypes, set: exportSet }) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try {
      
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
          return {
            success: false,
            message: error instanceof Error
                    ? error.message
                    : await getTranslation(lang, "serverErr")
          }
        }
}

export const graphFunc = async ({ shopId, userId, headers }: {shopId: string, userId: string, headers: headTypes}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";

        try {
    
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
    
          //4. total sales
          const salesByDay = await mainDb
          .select({
            day: sql`TO_CHAR(${sales.createdAt}, 'Dy')`.as ('day_of_week'),
            totalSales: sql`SUM(${sales.priceSold} * ${sales.quantity})` .as('total_sales')
          }).from(sales)
          .where(eq(sales.shopId, shopId))
          .groupBy(sql`day_of_week`)
          .orderBy(sql`day_of_week`)
    
          //5. net sales = sales - purchases - expenses
          const netSalesByDay = salesByDay.map((sale) => {
            const purchase = purchasesByDay.find(p => p.day === sale.day);
            const expense = expensesByDay.find(e => e.day === sale.day);
          
            const totalPurchases = purchase ? Number(purchase.totalPurchases) : 0;
            const totalExpenses = expense ? Number(expense.totalExpenses) : 0;
            const totalSales = Number(sale.totalSales);
          
            const netSales = totalSales - (totalPurchases + totalExpenses);
          
            return {
              day: sale.day,
              totalSales,
              totalPurchases,
              totalExpenses,
              netSales,
            };
          });
    
          //6. CashDebtData
          const cashDebtData = await mainDb
          .select({
            type: sales.saleType,
            amount: sql`SUM(${sales.priceSold} * ${sales.quantity})`.as('amount')
          })
          .from(sales)
          .where(eq(sales.shopId, shopId))
          .groupBy(sales.saleType);
    
          
        
          return {
            success: true,
            stocksByDay,
            expensesByDay,
            salesByDay,
            purchasesByDay,
            DebtsByCustomer,
            netSalesByDay,
            cashDebtData
          }
    
    
    
        } catch (error) {
          return {
            success: false,
            message: error instanceof Error
                    ? error.message
                    : getTranslation(lang, "serverErr")
          }
        }
}

export const debtsFunc = async({ userId, shopId, headers }: { userId: string, shopId: string, headers: headTypes}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";

        try {
    
          // total debts
          const totalDebts = await mainDb.
            select({
              totalDebts: sql`SUM(${debts.remainingAmount})` .as('total_debts'),
              totalUnpaid: sql`COUNT(*)` .as('total_count'),
              totalPaid: sql`COUNT(*)` .as('total_count'),
              totalCollected: sql`SUM(${debts.totalAmount}) - SUM(${debts.remainingAmount})` .as('total_collected'),
    
            })
            .from(debts)
            .where(eq(debts.shopId, shopId))
            .orderBy(sql`total_debts`)
            .groupBy(sql`total_debts`)
          
          // longest debt
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
    
          // most debt
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
    
          // most frequent user
          
    
    
          return {
            success: true,
            totalDebts: totalDebts || null,
            longTermDebtUser: longTermDebtUser || null,
            mostDebtUser: mostDebtUser || null,
          }
    
        } catch (error) {
              return {
                success: false,
                message: error instanceof Error
                        ? error.message
                        : getTranslation(lang, "serverErr")
              }
        }
}