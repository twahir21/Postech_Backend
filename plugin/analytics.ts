// routes/profits.ts
import { Cookie, Elysia } from 'elysia';
import jwt from '@elysiajs/jwt';
import { salesQueryData } from '../functions/security/validators/data';
import { debtsFunc, exportSales, getAnalytics, graphFunc, salesAnalytics } from '../functions/analyticsFunc';
import { extractId } from '../functions/security/jwtToken';


const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";

const analyticsRoute = new Elysia()
  .use(jwt({
      name: 'jwt',
      secret: JWT_SECRET,
  }))

  .get('/analytics', async ({ jwt, cookie, headers }) => {

    const { userId, shopId } = await extractId({ jwt, cookie });
    if (!shopId || !userId) return;


    return await getAnalytics({
      userId,
      shopId,
      headers
    })
  })


  .get('/sales', async ({ jwt, cookie, headers, query }) => {
    const { userId, shopId } = await extractId({ jwt, cookie });
    if (!shopId || !userId) return;


    return await salesAnalytics({
      userId,
      shopId,
      headers,
      query
    })
  }, {
    query: salesQueryData
  })

  .get('/export-sales', async ({ jwt, cookie, headers, set }) => {
    const { shopId, userId } = await extractId({ jwt, cookie });
    if (!shopId || !userId) return;


    return await exportSales({
      shopId,
      userId,
      headers,
      set
    })
  })

  .get("/graph", async ({ jwt, cookie, headers }) => {
    const { userId, shopId } = await extractId({ jwt, cookie });
    if (!shopId || !userId) return;


    return await graphFunc({
      userId, shopId, headers
    })
  })

  .get("/debts", async ({ jwt, cookie, headers }) => {
    const { userId, shopId } = await extractId({ jwt, cookie });
    if (!shopId || !userId) return;


    return await debtsFunc({
      shopId, userId, headers
    })
  })
  


export default analyticsRoute;
