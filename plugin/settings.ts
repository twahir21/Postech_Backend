import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { extractId } from "../functions/security/jwtToken";
import { deleteShop, shopSettingsFunc, shopSettingsPut, updatePassword } from "../functions/settingsFunc";
import { changePasswordData, shopPutData } from "../functions/security/validators/data";


const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";

const settingsPlugin = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET,
    }))
    .get("/shop", async ({ jwt, cookie, headers }) => {
        const { userId, shopId } = await extractId({ jwt, cookie });

        if (!shopId || !userId) return;

        return await shopSettingsFunc({
            shopId, userId, headers
        });
    })
    
    .put("/shop", async ({ jwt, cookie, headers, body }) => {
    const { userId, shopId } = await extractId({ jwt, cookie });
    if (!shopId || !userId) return;

    
    return await shopSettingsPut({
        shopId, userId, headers, body
    })

    }, {
        body: shopPutData
    })
    
    .put("/update-password", async ({ jwt, cookie, headers, body }) => {
        const { userId, shopId } = await extractId({ jwt, cookie });
        if (!shopId || !userId) return;

        return await updatePassword({
            shopId, userId, headers, body
        })
    }, {
        body: changePasswordData
    })
    
    .delete("/delete-shop", async ({ jwt, cookie, headers }) => {
        const { userId, shopId } = await extractId({ jwt, cookie });
        if (!shopId || !userId) return;

        return await deleteShop({
            shopId, userId, headers
        });
    })
    

export default settingsPlugin;