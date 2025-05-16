import Elysia from "elysia";
import { categDel, categGet, categPost, categPut } from "../functions/categFunc";
import jwt from "@elysiajs/jwt";
import { extractId } from "../functions/security/jwtToken";
import type { categoriesTypes } from "../types/types";
import { categData } from "../functions/security/validators/data";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";


const categoriesPlugin = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET
    }))

    .post("/categories", async ({ jwt, cookie, body, headers}) => {
        const { userId, shopId } = await extractId({ jwt, cookie});
        if (!shopId || !userId) return;


        return await categPost({
            body: body as categoriesTypes,
            userId,
            shopId,
            headers
        });
    }, {
        body: categData
    })

    .get("/categories", async ({ jwt, cookie, headers}) => {
        const { userId, shopId } = await extractId({ jwt, cookie});
        if (!shopId || !userId) return;


        return await categGet({ headers, shopId })
    })

    .put("/categories", async ({ jwt, cookie, headers, query, body}) => {
        const {userId, shopId } = await extractId({ jwt, cookie });
        if (!shopId || !userId) return;


        const { categoryId } = query;

        return await categPut({
            headers,
            body: body as categoriesTypes,
            categoryId,
            shopId
         })
    }, {
        body: categData
    })

    .delete("/categories", async ({ jwt, cookie, headers, query}) => {
        const { userId, shopId } = await extractId({ jwt, cookie });
        if (!shopId || !userId) return;


        const { categoryId } = query;

        if(!categoryId) {
            return {
                success: false,
                message: "CategoryId lazima iwepo."
            }
        }

        return await categDel({
            headers,
            categoryId,
            shopId
         })
        });

export default categoriesPlugin;