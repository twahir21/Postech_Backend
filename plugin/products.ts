import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { extractId } from "../functions/security/jwtToken";
import { prodDel, prodGet, prodPost, prodUpdate, QrPost } from "../functions/prodFunc";
import type { productTypes, QrData } from "../types/types";
import { getTranslation } from "../functions/translation";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";


export const prodPlugin = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET,
    }))
    .get("/products", async ({ jwt, cookie, headers, query }) => {
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

        return await prodGet({ userId, shopId, headers, query, set: { status: 200 } });
    })
    .post("/products", async ({ jwt, cookie, body, headers }) => {
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

        if (!(body as productTypes).categoryId || !(body as productTypes).supplierId) {
            throw new Error('Category ID and Supplier ID are required.');
        }

        return await prodPost({ 
            body: body as productTypes, 
            userId, 
            shopId, 
            headers,
            categoryId: (body as productTypes).categoryId || "",
            supplierId: (body as productTypes).supplierId || "",
        }); 
    })
    .delete("/products/:id", async ({ jwt, cookie, set, params, headers }) => {
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

        const productId = params.id;
        if (!productId) {
            set.status = 400;
            return { success: false, message: "Product ID is required." };
        }

        // Logic to delete the product by ID
        return await prodDel({ userId, shopId, headers, productId });
    })
    .put("/products/:id", async ({ jwt, cookie, set, params, body, headers }) => {
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

        const productId = params.id;
        if (!productId) {
            set.status = 400;
            return { success: false, message: "Product ID is required." };
        }

        return await prodUpdate({
            body: body as productTypes,
            userId,
            shopId,
            headers,
            productId,
        });
    })
    .post("/get-data", async ({ jwt, cookie, body, headers }) => {
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

        return await QrPost({ 
            body: body as QrData, 
            userId, 
            shopId, 
            headers,
        }); 
    });
