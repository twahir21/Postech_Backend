import Elysia from "elysia";
import { categDel, categGet, categGetOne, categPost, categPut } from "../functions/categFunc";
import jwt from "@elysiajs/jwt";
import cookie from "@elysiajs/cookie";
import { extractId } from "../functions/security/jwtToken";
import type { categoriesTypes } from "../types/types";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";


const categoriesPlugin = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET
    }))
    .post("/categories/:shopId", categPost)
    .post("categories", async ({ jwt, cookie, body, headers}) =>{
        const { userId, shopId } = await extractId({ jwt, cookie});
        return await categPost({
            body: body as categoriesTypes,
            userId,
            shopId,
            headers
        })
    })
    .get("/categories", async ({ jwt, cookie, headers}) => {
        const token = cookie.auth?.value;
        if (!token) {
            throw new Error("Unauthorized - no token")
        }

        const decoded = await jwt.verify(token)
        if (!decoded) {
            return { success: false}
        }

        return await categGet({ headers })
    })
    .put("/categories/:id", categPut)
    .delete("/categories/:id", categDel)
    .get("/categories/:id", categGetOne)

export default categoriesPlugin;