import Elysia from "elysia";
import { suppDel, suppGet, suppGetOne, suppPost, suppPut } from "../functions/suppFunc";
import jwt from "@elysiajs/jwt";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";


const suppPlugin = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET
    }))
    .get("/suppliers", suppGet)
    .post("/suppliers/:shopId", suppPost)
    .put("/suppliers/:id", suppPut)
    .delete("/suppliers/:id", suppDel)
    .get("/suppliers/:id", suppGetOne)

export default suppPlugin;