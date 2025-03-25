import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';

const JWT_SECRET = process.env.JWT_TOKEN || 'your_secret_key';

export const authMiddleware = new Elysia()
    .use(jwt({
        secret: JWT_SECRET,
        algorithm: 'HS256'
    }))
    .derive(async ({ jwt, cookie, headers }) => {
        console.log("🔹 Middleware triggered");

        const token = cookie.auth_token;
        if (!token) {
            console.log("❌ No token found");
            return { success: false, message: "No token provided" };
        }

        try {
            const decoded = await jwt.verify(token);
            if (!decoded || typeof decoded !== "object" || !decoded.userId || !decoded.shopId) {
                console.log("❌ Invalid token:", decoded);
                return { success: false, message: "Invalid token" };
            }

            console.log("✅ Token validated:", decoded);
            return { userId: decoded.userId, shopId: decoded.shopId };
        } catch (error) {
            console.error("❌ Token verification error:", error);
            return { success: false, message: "Token verification failed" };
        }
    });
