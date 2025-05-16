import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { checkUSSD, genToken, PayStatus, USSDPush } from "../functions/paymentFunc";
import { extractId } from "../functions/security/jwtToken";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";


const paymentPlugin = new Elysia()
        .use(jwt({
            name: 'jwt',
            secret: JWT_SECRET,
        }))
        .get("/mobile/generate-token", async ({ jwt, cookie, headers }) => {

            const { userId, shopId } = await extractId({ jwt, cookie })

            if (!userId || !shopId) {
                return {
                    success: false,
                    message: "Imeshindwa ku extract tokeni, jaribu tena baadae"
                }
            };

            return await genToken({ userId, shopId, headers });
        })
        .get("/mobile/check-USSD", async ({ jwt, cookie, headers }) => {

            const { userId, shopId } = await extractId({ jwt, cookie })

            if (!userId || !shopId) {
                return {
                    success: false,
                    message: "Imeshindwa ku extract tokeni, jaribu tena baadae"
                }
            };

            return await checkUSSD({ userId, shopId, headers });
        })
        .get("/mobile/USSD-push", async ({ jwt, cookie, headers }) => {

            const { userId, shopId } = await extractId({ jwt, cookie })

            if (!userId || !shopId) {
                return {
                    success: false,
                    message: "Imeshindwa ku extract tokeni, jaribu tena baadae"
                }
            };

            return await USSDPush({ userId, shopId, headers });
        })
        .get("/mobile/payment-status", async ({ jwt, cookie, headers }) => {

            const { userId, shopId } = await extractId({ jwt, cookie })

            if (!userId || !shopId) {
                return {
                    success: false,
                    message: "Imeshindwa ku extract tokeni, jaribu tena baadae"
                }
            };

            return await PayStatus({ userId, shopId, headers });
        })



export default paymentPlugin