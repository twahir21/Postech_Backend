import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { cookie } from '@elysiajs/cookie';

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";

export const authPlugin = new Elysia()
    .use(cookie())
    .use(jwt({ name: 'jwt', secret: JWT_SECRET }))
    .get('/validate-session', async ({ jwt, cookie }) => {
        const authToken = cookie.auth_token;

        if (!authToken) {
            return { success: false, message: 'No token provided' };
        }

        const payload = await jwt.verify(authToken);
        if (!payload) {
            return { success: false, message: 'Invalid token' };
        }

        // Return user data or session status
        return { success: true, userId: payload.userId, shopId: payload.shopId };
    });