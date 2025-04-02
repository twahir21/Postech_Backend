import Elysia from "elysia";
import { suppDel, suppGet, suppGetOne, suppPost, suppPut } from "../functions/suppFunc";
import jwt from "@elysiajs/jwt";
import { getTranslation } from "../functions/translation";
import { extractId } from "../functions/security/jwtToken";
import type { suppTypes } from "../types/types";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";


const suppPlugin = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET
    }))
    .get("/suppliers", async ({ jwt, cookie, headers}) => {
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

            return suppGet
        })
    .post("/suppliers", async ({ jwt, cookie, headers, body}) => {
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

        return suppPost ({ shopId, body: body as suppTypes, headers })
    })

    .put("/suppliers", async ({ jwt, cookie, headers, query, body}) => {
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

        const { supplierId } = query;

        return suppPut({ body: body as suppTypes, headers, supplierId})
    })


    .delete("/suppliers", async ({ jwt, cookie, headers, query}) => {
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

        const { supplierId } = query;

        return suppDel ({ supplierId, headers });
    })


    .get("/suppliers", async ({ jwt, cookie, headers, query}) => {
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

        const { supplierId } = query;

        return suppGetOne ({ supplierId, headers});
    })

export default suppPlugin;