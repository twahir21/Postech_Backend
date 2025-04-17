import Elysia from 'elysia';
import dayjs from 'dayjs';
import { and, gte, lte, like } from 'drizzle-orm';
import { mainDb } from '../database/schema/connections/mainDb';
import { sales } from '../database/schema/shop';

export const salesRoute = new Elysia().get('/sales', async ({ query }) => {
  const { filter = 'today', search = '', start, end } = query;

  // Define default date range
  let startDate = dayjs().startOf('day').toISOString();
  let endDate = dayjs().endOf('day').toISOString();

  // Handle filter options
  switch (filter) {
    case 'yesterday':
      startDate = dayjs().subtract(1, 'day').startOf('day').toISOString();
      endDate = dayjs().subtract(1, 'day').endOf('day').toISOString();
      break;
    case 'this_week':
      startDate = dayjs().startOf('week').toISOString();
      break;
    case 'this_month':
      startDate = dayjs().startOf('month').toISOString();
      break;
    case 'custom':
      if (start) startDate = dayjs(start).startOf('day').toISOString();
      if (end) endDate = dayjs(end).endOf('day').toISOString();
      break;
    case 'today':
    default:
      // Already set as today
      break;
  }

  const whereConditions = [
    gte(sales.createdAt, startDate),
    lte(sales.createdAt, endDate),
  ];

  if (search.trim()) {
    whereConditions.push(
      like(sales.customerName, `%${search.trim()}%`)
      // Add more LIKE clauses if you want to search product names, etc.
    );
  }

  const result = await mainDb.query.sales.findMany({
    where: and(...whereConditions),
    orderBy: (s) => s.date,
    with: {
      products: true,
      customer: true,
    },
  });

  return result.map((sale) => ({
    id: sale.id,
    date: sale.date,
    total: sale.totalAmount,
    paymentType: sale.paymentType,
    customer: sale.customer?.name || sale.customerName || 'N/A',
    products: sale.products.map((p) => ({
      name: p.name,
      qty: p.quantity,
    })),
  }));
});
