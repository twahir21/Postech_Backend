// routes/profits.ts
import { Elysia } from 'elysia';
import { mainDb } from '../db'; // your db instance
import { sales, purchases, products, expenses } from '../schema'; // your tables
import { eq, and, sql } from 'drizzle-orm';

const profitsRoute = new Elysia().get('/profits', async ({ query }) => {
  const shopId = query.shopId;

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
      COALESCE(SUM(s.quantity * s.priceSold), 0) AS totalSales,
      COALESCE(SUM(pur.quantity * pur.priceBought), 0) AS totalCost,
      COALESCE(SUM(s.quantity * s.priceSold), 0) - COALESCE(SUM(pur.quantity * pur.priceBought), 0) AS profit
    FROM products p
    LEFT JOIN sales s ON s.productId = p.id AND s.shopId = ${shopId}
    LEFT JOIN purchases pur ON pur.productId = p.id AND pur.shopId = ${shopId}
    WHERE p.shopId = ${shopId}
    GROUP BY p.id, p.name
    ORDER BY profit DESC
  `);

  // 🔹 Net Profit Summary
  const netProfitResult = await mainDb.execute(sql`
    SELECT 
      (SELECT COALESCE(SUM(s.quantity * s.priceSold), 0) FROM sales s WHERE s.shopId = ${shopId}) AS totalSales,
      (SELECT COALESCE(SUM(p.quantity * p.priceBought), 0) FROM purchases p WHERE p.shopId = ${shopId}) AS totalPurchases,
      (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.shopId = ${shopId}) AS totalExpenses
  `);

  const net = netProfitResult[0];
  const netProfit = {
    totalSales: Number(net.totalSales),
    totalPurchases: Number(net.totalPurchases),
    totalExpenses: Number(net.totalExpenses),
    netProfit: Number(net.totalSales) - Number(net.totalPurchases) - Number(net.totalExpenses)
  };

  return {
    success: true,
    profitPerProduct,
    netProfit
  };
});

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

console.log(lowestProduct);


export default profitsRoute;
