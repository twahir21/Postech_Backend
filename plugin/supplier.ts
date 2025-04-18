import Elysia from "elysia";
import { suppDel, suppGet, suppPost, suppPut } from "../functions/suppFunc";
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

            return suppGet ({ headers, shopId, userId, query });
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

    .put("/suppliers/:id", async ({ jwt, cookie, headers, params, body}) => {
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

        const supplierId = params.id;
        if (!supplierId) {
            return { success: false, message: "Product ID is required." };
        }
        return suppPut({ body: body as suppTypes, headers, supplierId})
    })


    .delete("/suppliers/:id", async ({ jwt, cookie, headers, params}) => {
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

        const supplierId = params.id;
        if (!supplierId) {
            return { success: false, message: "Product ID is required." };
        }

        return suppDel ({ supplierId, headers });
    })

export default suppPlugin;