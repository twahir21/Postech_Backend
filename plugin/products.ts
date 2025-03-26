import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { extractId } from "../functions/security/jwtToken";
import { prodGet, prodPost } from "../functions/prodFunc";
import type { productTypes } from "../types/types";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";


export const prodPlugin = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET,
    }))
    .get("/products", async ({ jwt, cookie}) => {
        const { userId, shopId } = await extractId({ jwt, cookie });
        return prodGet({ userId, shopId });
    })
    .post("/products", async ({ jwt, cookie, query, body, headers }) => {
        const { userId, shopId} = await extractId({ jwt, cookie});
        const { categoryId, supplierId } = query;
        return await prodPost({ 
            body: body as productTypes, 
            userId, 
            shopId, 
            categoryId, 
            supplierId, 
            headers
        }); 
    })
