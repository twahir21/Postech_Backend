import Elysia from "elysia";
import { prodGet, prodPost } from "../functions/prodFunc";
import { authMiddleware } from "../middlewares/authMid";

const prodPlugin = new Elysia ()
    .use(authMiddleware)
    .post("/products/", async ({userId, shopId}: any) => await prodPost({userId, shopId}))
    .get("/products/", ({userId, shopId}: any) => prodGet({userId, shopId}))


export default prodPlugin