import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { extractId } from "../functions/security/jwtToken";
import { getTranslation } from "../functions/translation";
import type { CustomerTypes } from "../types/types";
import { CustomerDel, customerFetch, customerGet, customerPost, customerUpdate } from "../functions/customerFunc";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";


export const CustomersPlugin = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET,
    }))
    .get("/customers", async ({ jwt, cookie, headers, query }) => {
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

        return await customerGet({ userId, shopId, headers, query});
    })
    .get("/getCustomers", async ({ jwt, cookie, headers }) => {
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

        return await customerFetch({ userId, shopId, headers});
    })
    .post("/customers", async ({ jwt, cookie, body, headers }) => {
        const { userId, shopId} = await extractId({ jwt, cookie});
        const lang: any = headers["accept-language"]?.split(",") || "sw";
        const token = cookie.auth_token?.value;
        if (!token) {
            throw new Error(`${await getTranslation(lang, "noToken")}`)
        }

        const decoded = await jwt.verify(token)
        if (!decoded) {
            throw new Error("Unauthorized -  invalid token ")
        }

        if (!(body as CustomerTypes).name || !(body as CustomerTypes).contact) {
            throw new Error('Customer name and contacts are required.');
        }

        return await customerPost({ 
            body: body as CustomerTypes, 
            userId, 
            shopId, 
            headers,
        }); 
    })
    .delete("/customers/:id", async ({ jwt, cookie, set, params, headers }) => {
        const { userId, shopId } = await extractId({ jwt, cookie });
        const lang: any = headers["accept-language"]?.split(",") || "sw";
        const token = cookie.auth_token?.value;
        if (!token) {
            throw new Error(`${await getTranslation(lang, "noToken")}`)
        }

        const decoded = await jwt.verify(token)
        if (!decoded) {
            throw new Error("Unauthorized -  invalid token ")
        }

        const customerId = params.id;
        if (!customerId) {
            set.status = 400;
            return { success: false, message: "Product ID is required." };
        }

        // Logic to delete the product by ID
        return await CustomerDel({ userId, shopId, headers, customerId });
    })
    .put("/customers/:id", async ({ jwt, cookie, set, params, body, headers }) => {
        const { userId, shopId } = await extractId({ jwt, cookie });
        const lang: any = headers["accept-language"]?.split(",") || "sw";
        const token = cookie.auth_token?.value;
        if (!token) {
            throw new Error(`${await getTranslation(lang, "noToken")}`)
        }

        const decoded = await jwt.verify(token)
        if (!decoded) {
            throw new Error("Unauthorized -  invalid token ")
        }

        const customerId = params.id;
        if (!customerId) {
            set.status = 400;
            return { success: false, message: "Product ID is required." };
        }

        return await customerUpdate({
            body: body as CustomerTypes,
            userId,
            shopId,
            headers,
            customerId,
        });
    })
