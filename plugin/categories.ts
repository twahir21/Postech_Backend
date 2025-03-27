import Elysia from "elysia";
import { categDel, categGet, categGetOne, categPost, categPut } from "../functions/categFunc";
import jwt from "@elysiajs/jwt";
import { extractId } from "../functions/security/jwtToken";
import type { categoriesTypes } from "../types/types";
import { getTranslation } from "../functions/translation";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";


const categoriesPlugin = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET
    }))

    .post("/categories", async ({ jwt, cookie, body, headers}) => {
        const { userId, shopId } = await extractId({ jwt, cookie});
        const lang: any = headers["accept-language"]?.split(",") || "sw";
        const token = cookie.auth?.value;
        if (!token) {
            throw new Error(`${await getTranslation(lang, "noToken")}`)
        }

        const decoded = await jwt.verify(token)
        if (!decoded) {
            throw new Error("Unauthorized -  invalid token ")
        }
        return await categPost({
            body: body as categoriesTypes,
            userId,
            shopId,
            headers
        })
    })

    .get("/categories", async ({ jwt, cookie, headers}) => {
        const lang: any = headers["accept-language"]?.split(",") || "sw";
        const token = cookie.auth?.value;
        if (!token) {
            throw new Error(`${await getTranslation(lang, "noToken")}`)
        }

        const decoded = await jwt.verify(token)
        if (!decoded) {
            throw new Error("Unauthorized -  invalid token ")
        }

        return await categGet({ headers })
    })

    .put("/categories", async ({ jwt, cookie, headers, query, body}) => {
        const lang: any = headers["accept-language"]?.split(",") || "sw";
        const token = cookie.auth?.value;
        if (!token) {
            throw new Error(`${await getTranslation(lang, "noToken")}`)
        }

        const decoded = await jwt.verify(token)
        if (!decoded) {
            throw new Error("Unauthorized -  invalid token ");
        }

        const { categoryId } = query;

        return await categPut({
            headers,
            body: body as categoriesTypes,
            categoryId
         })
    })

    .delete("/categories", async ({ jwt, cookie, headers, query}) => {
        const lang: any = headers["accept-language"]?.split(",") || "sw";
        const token = cookie.auth?.value;
        if (!token) {
            throw new Error(`${await getTranslation(lang, "noToken")}`)
        }

        const decoded = await jwt.verify(token)
        if (!decoded) {
            throw new Error("Unauthorized -  invalid token ");
        }

        const { categoryId } = query;

        return await categDel({
            headers,
            categoryId
         })
        })
    .get("/categories", async ({ jwt, cookie, headers, query}) => {
        const lang: any = headers["accept-language"]?.split(",") || "sw";
        const token = cookie.auth?.value;
        if (!token) {
            throw new Error(`${await getTranslation(lang, "noToken")}`)
        }

        const decoded = await jwt.verify(token)
        if (!decoded) {
            throw new Error("Unauthorized -  invalid token ");
        }

        const { categoryId } = query;

        return await categGetOne({
            headers,
            categoryId
         })
        })

export default categoriesPlugin;