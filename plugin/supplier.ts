import Elysia from "elysia";
import { suppDel, suppGet, suppPost, suppPut } from "../functions/suppFunc";
import jwt from "@elysiajs/jwt";
import { extractId } from "../functions/security/jwtToken";
import type { suppTypes } from "../types/types";
import { suppData } from "../functions/security/validators/data";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";


const suppPlugin = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET
    }))

    .get("/suppliers", async ({ jwt, cookie, headers, query}) => {
            const { userId, shopId } = await extractId({ jwt, cookie });
            if (!shopId || !userId) return;


            return suppGet ({ headers, shopId, userId, query });
        })

    .post("/suppliers", async ({ jwt, cookie, headers, body}) => {
        const { userId, shopId } = await extractId({ jwt, cookie });
        if (!shopId || !userId) return;


        return suppPost ({ shopId, body: body as suppTypes, headers })
    }, {
        body: suppData
    })

    .put("/suppliers/:id", async ({ jwt, cookie, headers, params, body}) => {
        const { userId, shopId } = await extractId({ jwt, cookie });

        const supplierId = params.id;
        if (!supplierId) {
            return { success: false, message: "Product ID is required." };
        }
        return suppPut({ body: body as suppTypes, headers, supplierId})
    }, {
        body: suppData
    })


    .delete("/suppliers/:id", async ({ jwt, cookie, headers, params}) => {
        const { userId, shopId } = await extractId({ jwt, cookie });

        const supplierId = params.id;
        if (!supplierId) {
            return { success: false, message: "Product ID is required." };
        }
        if (!shopId || !userId) return;

        return suppDel ({ supplierId, headers, shopId });
    })

export default suppPlugin;