import Elysia from "elysia";
import { suppDel, suppGet, suppGetOne, suppPost, suppPut } from "../functions/suppFunc";
import jwt from "@elysiajs/jwt";
import { getTranslation } from "../functions/translation";
import { extractId } from "../functions/security/jwtToken";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";


const suppPlugin = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET
    }))
    .get("/suppliers", async ({ jwt, cookie, headers}) => {
            const { userId, shopId } = await extractId({ jwt, cookie });
            const lang: any = headers["accept-language"]?.split(",") || "sw";
            const token = cookie.auth?.value;
            if (!token) {
                throw new Error(`${await getTranslation(lang, "noToken")}`)
            }
    
            const decoded = await jwt.verify(token)
            if (!decoded) {
                throw new Error("Unauthorized -  invalid token ")
            }

            return suppGet
        })
    .post("/suppliers/:shopId", suppPost)
    .put("/suppliers/:id", suppPut)
    .delete("/suppliers/:id", suppDel)
    .get("/suppliers/:id", suppGetOne)

export default suppPlugin;