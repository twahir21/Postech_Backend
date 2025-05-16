import { Elysia } from 'elysia';
import cookie from '@elysiajs/cookie';
import jwt from '@elysiajs/jwt';
import { authToken } from '../functions/security/validators/data';
import { extractId, isDecodedToken } from '../functions/security/jwtToken';
import { getTranslation } from '../functions/translation';
import { mainDb } from '../database/schema/connections/mainDb';
import { users } from '../database/schema/shop';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";

export const authPlugin = new Elysia()
    .use(cookie())
    .use(jwt({ name: 'jwt', secret: JWT_SECRET }))
    .post('/verify-cookie', async ({ jwt, body, headers }) => {
        const lang = headers["accept-language"]?.split(",")[0] || "sw";

        try {
            const token = body.token as string;
    
            const decoded = await jwt.verify(token);
    
            if (!isDecodedToken(decoded)) {
                return {
                success: false,
                message: "Huna ruhusa! - Token sio sahihi"
                }
            }
            return { success: true, message: "Umefanikiwa kukaguliwa"};
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error
                            ? error.message
                            : await getTranslation(lang, "serverErr")
            }
        }
    }, {
        body: authToken
    })
    .get("/delete-cookie", async ({ headers, cookie }) => {
        const lang = headers["accept-language"]?.split(",")[0] || "sw";
        try {
            cookie.auth_token.set({
                value: "",
                httpOnly: true,
                secure: process.env.NODE_ENV === 'development' ? false : true,
                sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
                maxAge: 0,
                path: '/',
                domain: process.env.NODE_ENV === 'development' 
                        ? undefined: ".mypostech.store"
            });
            return {
                success: true,
                message: "umefanikiwa kutoka"
            }
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error
                            ? error.message
                            : await getTranslation(lang, "serverErr")
            }
        }
    }).get("/me", async ({ jwt, cookie, headers }) => {
        const lang = headers["accept-language"]?.split(",")[0] || "sw";
        try{
            const { userId, shopId } = await extractId({ jwt, cookie });
            if (!userId) return;
            const usernameInfo = await mainDb
                                    .select({ username: users.username})
                                    .from(users).where(eq(users.id, userId));
            const username = usernameInfo[0].username;
            return {
                success: true,
                data: [{ username }],
                message: "successful"
            }
        }catch (error) {
            return {
                success: false,
                message: error instanceof Error
                            ? error.message
                            : await getTranslation(lang, "serverErr")
            }
        }
    })