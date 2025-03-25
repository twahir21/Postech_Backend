import { Elysia } from 'elysia';
import { cookie } from '@elysiajs/cookie';
import { jwt } from '@elysiajs/jwt';
import argon2 from 'argon2'; // For hashing passwords
import { mainDb } from '../database/schema/connections/mainDb';
import { users, shopUsers } from '../database/schema/shop';
import { eq } from 'drizzle-orm';
import type { loginTypes } from '../types/types';

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";

export const loginPlugin = new Elysia()
    .use(cookie()) // Use cookie plugin
    .use(
        jwt({
            name: 'jwt',
            secret: JWT_SECRET,  // Secret for JWT
        })
    )
    .post('/login', async ({ body, jwt, cookie }: {body: loginTypes, jwt: any, cookie: any}) => {
        const { username, password } = body;

        // Check for missing credentials
        if (!username || !password) {
            return { success: false, message: 'Username and password required' };
        }

        // Fetch user from the database
        const user = await mainDb.select().from(users).where(eq(users.username, username)).limit(1);
        if (!user.length) {
            return { success: false, message: 'Invalid credentials' };
        }

        const userData = user[0];

        // Verify password with Argon2
        const isValidPassword = await argon2.verify(userData.password, password);
        if (!isValidPassword) {
            return { success: false, message: 'Invalid credentials' };
        }

        // Fetch associated shopId
        const shop = await mainDb.select().from(shopUsers).where(eq(shopUsers.userId, userData.id)).limit(1);
        if (!shop.length) {
            return { success: false, message: 'No shop assigned to this user' };
        }

        const shopId = shop[0].shopId;

        // Generate JWT with user and shop info
        const token = await jwt.sign({ userId: userData.id, shopId });

        // Set JWT in a cookie with options
        cookie.auth.set({
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            sameSite: 'strict',
            maxAge: 7 * 86400,  // 7 days
            path: '/',
        });

        return {
            success: true,
            message: `Successfully logged in as ${username}`,
            token,
        };
    })
    .get('/profile', async ({ jwt, cookie, error }) => {
        // Verify the JWT from the cookie
        const profile = await jwt.verify(cookie.auth.value);

        if (!profile) {
            return error(401, { success: false, message: 'Unauthorized' });
        }

        return {
            success: true,
            message: `Hello ${profile.username}`,
            user: profile,
        };
    })
