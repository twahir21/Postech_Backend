import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { extractId } from "../functions/security/jwtToken";
import type { CustomerTypes } from "../types/types";
import { CustomerDel, customerFetch, customerGet, customerPost, customerUpdate } from "../functions/customerFunc";
import { customerData } from "../functions/security/validators/data";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";


export const CustomersPlugin = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET,
    }))
    .get("/customers", async ({ jwt, cookie, headers, query }) => {
        const { userId, shopId } = await extractId({ jwt, cookie });
        if (!shopId || !userId) return;

        
        return await customerGet({ userId, shopId, headers, query});
    })
    .get("/getCustomers", async ({ jwt, cookie, headers }) => {
        const { userId, shopId } = await extractId({ jwt, cookie });
        if (!shopId || !userId) return;


        return await customerFetch({ userId, shopId, headers});
    })
    .post("/customers", async ({ jwt, cookie, body, headers }) => {
        const { userId, shopId} = await extractId({ jwt, cookie});
        if (!shopId || !userId) return;


        return await customerPost({ 
            body: body as CustomerTypes, 
            userId, 
            shopId, 
            headers,
        }); 
    }, {
        body: customerData
    })
    .delete("/customers/:id", async ({ jwt, cookie, set, params, headers }) => {
        const { userId, shopId } = await extractId({ jwt, cookie });
        if (!shopId || !userId) return;


        const customerId = params.id;
        if (!customerId) {
            set.status = 400;
            return { success: false, message: "Mteja anahitajika." };
        }

        // Logic to delete the product by ID
        return await CustomerDel({ userId, shopId, headers, customerId });
    })
    .put("/customers/:id", async ({ jwt, cookie, set, params, body, headers }) => {
        const { userId, shopId } = await extractId({ jwt, cookie });
        if (!shopId || !userId) return;


        const customerId = params.id;
        if (!customerId) {
            set.status = 400;
            return { success: false, message: "Mteja anahitajika." };
        }

        return await customerUpdate({
            body: body as CustomerTypes,
            userId,
            shopId,
            headers,
            customerId,
        });
    }, {
        body: customerData
    })
