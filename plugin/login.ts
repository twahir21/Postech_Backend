import { Elysia } from 'elysia';
import { cookie } from '@elysiajs/cookie';
import { jwt } from '@elysiajs/jwt';
import argon2 from 'argon2'; // For hashing passwords
import { mainDb } from '../database/schema/connections/mainDb';
import { users, shopUsers } from '../database/schema/shop';
import { eq } from 'drizzle-orm';
import { getTranslation } from '../functions/translation';
import { sanitizeString } from '../functions/security/xss';

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";

export const loginPlugin = new Elysia()
    .use(cookie()) // Use cookie plugin
    .use(
        jwt({
            name: 'jwt',
            secret: JWT_SECRET,  // Secret for JWT
        })
    )
    .post('/login', async ({ body, jwt, cookie, headers }) => {
        const lang = headers["accept-language"]?.split(",")[0] || "sw";

        try {
            let { username, password }: any = body;
            // sanitize
            username = sanitizeString(username);
            password = sanitizeString(password);

            // Check for missing credentials
            if (!username || !password) {
                return { 
                    success: false, 
                    message: await getTranslation(lang, "missingCredentials")
                };
            }

            // Fetch user from the database
            const user = await mainDb.select().from(users).where(eq(users.username, username)).limit(1);
            if (!user.length) {
                return { 
                    success: false, 
                    message: await getTranslation(lang, "loginErr")
                };
            }

            const userData = user[0];

            // Verify password with Argon2
            const isValidPassword = await argon2.verify(userData.password, password);
            if (!isValidPassword) {
                return { success: false, message: await getTranslation(lang, "loginErr") };
            }

            // Fetch associated shopId
            const shop = await mainDb.select().from(shopUsers).where(eq(shopUsers.userId, userData.id)).limit(1);
            if (!shop.length) {
                return { success: false, message: 'No shop assigned to this user' };
            }

            const shopId = shop[0].shopId;

            // Generate JWT with user and shop info
            const token = await jwt.sign({ 
                userId: userData.id,
                shopId
            });

            if (!token) {
                return {
                    success: false,
                    message: await getTranslation(lang, "noToken")
                };
            }

            // Set JWT in a cookie with options
            cookie.auth.set({
                value: token,
                httpOnly: true, // prevents JavaScript from stealing the cookie (if stealed user get authenticated)
                secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
                sameSite: 'strict',
                maxAge: 7 * 86400,  // 7 days
                path: '/',
            });

            return {
                success: true,
                message: `${await getTranslation(lang, "loginSuccess")} ${username}`,
                token,
            };
        } catch (error) {
            if (error instanceof Error) {
                return {
                    success: false,
                    message: error.message
                };
            } else {
                return {
                    success: false,
                    message: await getTranslation(lang, "serverErr")
                };
            }
        }
    })
    .get('/protected', async ({ jwt, cookie, error }) => {
        const token = cookie.auth?.value;
    
        console.log('Token:', token);  // Log the token value
    
        if (!token) {
            return error(401, 'Unauthorized - No token');
        }
    
        try {
            console.log(token);
            const decoded = await jwt.verify(token);  // Verify token
    
            if (!decoded) {
                return {
                    success: false
                }
            }
            const { userId, shopId } = decoded;
            return `Hello, User ID: ${userId}, Shop ID: ${shopId}`;
        } catch (err) {
            console.error('Token verification failed:', err);  // Log any errors during verification
            return error(401, 'Unauthorized - Invalid token');
        }
    });
    