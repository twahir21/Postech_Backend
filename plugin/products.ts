import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { extractId } from "../functions/security/jwtToken";
import { prodDel, prodGet, prodPost, prodUpdate, QrPost } from "../functions/prodFunc";
import type { productTypes, QrData } from "../types/types";
import { prodData, QrPostData } from "../functions/security/validators/data";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";


export const prodPlugin = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET,
    }))
    .get("/products", async ({ jwt, cookie, headers, query }) => {
        const { userId, shopId } = await extractId({ jwt, cookie });
        if (!shopId || !userId) return;


        return await prodGet({ userId, shopId, headers, query, set: { status: 200 } });
    })
    .post("/products", async ({ jwt, cookie, body, headers }) => {
        const { userId, shopId} = await extractId({ jwt, cookie});
        if (!shopId || !userId) return;



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
    }, {
        body: prodData
    })
    .delete("/products/:id", async ({ jwt, cookie, set, params, headers }) => {
        const { userId, shopId } = await extractId({ jwt, cookie });
        if (!shopId || !userId) return;


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
        if (!shopId || !userId) return;


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
    }, {
        body: prodData
    })
    .post("/get-data", async ({ jwt, cookie, body, headers }) => {
        const { userId, shopId} = await extractId({ jwt, cookie});
        if (!shopId || !userId) return;


        return await QrPost({ 
            body: body as QrData, 
            userId, 
            shopId, 
            headers,
        }); 
    }, {
        body: QrPostData
    });
