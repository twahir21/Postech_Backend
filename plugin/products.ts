import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { extractId } from "../functions/security/jwtToken";
import { prodGet } from "../functions/prodFunc";

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