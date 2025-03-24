import { Elysia, t } from 'elysia';
import { jwt, type JWTPayloadSpec } from '@elysiajs/jwt';
import { users, shopUsers } from '../database/schema/shop';
import argon2 from 'argon2';
import { mainDb } from '../database/schema/connections/mainDb';
import { eq } from 'drizzle-orm';
import { getTranslation } from '../functions/translation';
import type { headTypes, loginTypes } from '../types/types';
import { z } from 'zod';
import { sanitizeString } from '../functions/security/xss';

// Define JWT Payload Type
interface AuthPayload extends JWTPayloadSpec {
    userId: string;
    shopId: string;
}

// Define Request Context Type
interface LoginContext {
    body: loginTypes;
    headers: headTypes;
    jwt: {
        sign: (payload: AuthPayload) => Promise<string>;
    };
    setCookie: (name: string, value: string, options?: Record<string, unknown>) => void;
}

export const loginPlugin = new Elysia()
    .use(jwt({
        secret: process.env.JWT_SECRET!,
        algorithm: 'HS256', // Explicitly set
        exp: '7d'
    }))
    .post('/login', async ({ body, setCookie, jwt, headers }: LoginContext) => {
        const lang = headers['accept-language']?.split(',')[0] || 'sw';

        try {
            const schema = z.object({
                username: z.string().min(3, await getTranslation(lang, "usernameErr")),
                password: z.string().min(6, await getTranslation(lang, "passErr"))
            }); 
            const parsed = schema.safeParse(body);

            if (!parsed.success) {
                return {
                    success: false,
                    message: parsed.error.format()
                }
            }
            // now extract data from users and sanitize
            let { username, password } : loginTypes = body;

            username = sanitizeString(username);
            password = sanitizeString (password);

            // Find user by username
            const user = await mainDb.select().from(users).where(eq(users.username, username)).limit(1);
            if (!user.length) {
                return {
                    success: false,
                    message: await getTranslation(lang, 'loginErr')
                };
            }

            const userData = user[0];


            // Verify password with Argon2
            const isValidPassword = await argon2.verify(userData.password, password);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: await getTranslation(lang, 'loginErr')
                };
            }

            // Get all shopIds associated with the user
            const shops = await mainDb.select().from(shopUsers).where(eq(shopUsers.userId, userData.id));
            if (!shops.length) {
                return {
                    success: false,
                    message: await getTranslation(lang, 'noShopErr')
                };
            }

            const shopId = shops[0].shopId; // Default to first shop

            // Generate JWT
            const token = await jwt.sign({ userId: userData.id, shopId });

            // Set JWT cookie
            setCookie('auth_token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 // 7 days
            });

            return { success: true, token };
        } catch (error) {
            if(error instanceof Error) {
                return {
                    success: false,
                    message: error.message
                }
            }else{
                return{
                    success: false,
                    message: await getTranslation(lang, "serverErr")
                }
            }
        }
    });
