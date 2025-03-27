import cookie from "@elysiajs/cookie";
import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { extractId } from "../functions/security/jwtToken";
import { generateQRCodeWithLogo } from "../functions/qrCodeFunc";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";

const qrCodePlugin = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET

    }))
    .get("/generate-qrcode", async ({ query, jwt, cookie}) => {
        const { userId, shopId} = await extractId({ jwt, cookie});
        const { productId } = query;

        const logoPath = './images/logo.png';
        const outputPath = './images/output.png';

        const prodData = {
            product: {
                action: "sale",  // or "stock_add"
                shopId: shopId,
                productId: productId,
                userId: userId,
                quantity: 5
              }
              
        }

        const data = JSON.stringify(prodData);

        return await generateQRCodeWithLogo(data, logoPath, outputPath)
        
    })

export default qrCodePlugin