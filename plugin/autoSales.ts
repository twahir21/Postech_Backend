import jwt from "@elysiajs/jwt";
import Elysia from "elysia";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";

const automateTasks = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: JWT_SECRET
    }))
    .get("/scan-qrcode", async({ jwt, cookie, query}) => {
        const token = cookie.auth?.value;
        if (!token) {
            throw new Error("Unauthorized - no token");
        }

        const decoded = await jwt.verify(token);

        if(!decoded) {
            throw new Error("Unauthorized - Invalid Token!")
        }

        // defining queries from the link  
        const { priceSold, shopId, productId, userId, quantity, saleType, discount, customerId, description, amount} = query;
        
        return { 
            priceSold, shopId, productId, userId, quantity, saleType, discount, customerId, description, amount
        }
    });

export default automateTasks