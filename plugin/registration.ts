import Elysia, { redirect } from "elysia";
import { regPost } from "../functions/regFunc";
import { registerData } from "../functions/security/validators/data";
import { getTranslation } from "../functions/translation";
import { mainDb } from "../database/schema/connections/mainDb";
import { emailVerifications, shops, shopUsers, users } from "../database/schema/shop";
import { eq } from "drizzle-orm";
import cookie from "@elysiajs/cookie";
import jwt from "@elysiajs/jwt";

const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";

const frontendURL = process.env.NODE_ENV === 'development'
                    ? process.env.FRONTEND_URL_DEV!
                    : process.env.FRONTEND_URL!

const regPlugin = new Elysia()
    .use(cookie()) // Use cookie plugin
    .use(
        jwt({
            name: 'jwt',
            secret: JWT_SECRET,  // Secret for JWT
        })
    )
    .post("/register", regPost, { body: registerData })

    .get("/verify-email", async ({ headers, query, cookie: { auth_token }, jwt }) =>  {
        const lang = headers["accept-language"]?.split(",")[0] || "sw";
        const token = query.token;

        if (!token) {
            return {
                success: false,
                message: "Huwezi kusajiliwa bila email na tokeni sahihi"
            }
        }
    
        try {
            // checking token if valid and not expired
            const result = await mainDb.select().from(emailVerifications)
                .where(eq(emailVerifications.token, token));

            // check if exist
            if (result.length === 0) {
                return{
                    success: false,
                    message: "Token sio sahihi, fuata njia ya halali"
                }
            }

            // check if not expired
            if (new Date() > result[0].expiresAt) {
                return {
                    success: false,
                    message: "Token imeisha muda wake"
                }
            }

            // now save to production database
            // mark token as used
            await mainDb.update(emailVerifications).set({
                used: true
            }).where(eq(emailVerifications.token, token));

            // Save user to database and get the user ID
            const user = await mainDb.insert(users)
                .values({
                    username: result[0].username,
                    email: result[0].email,
                    password: result[0].password,
                    phoneNumber: result[0].phone
                })
                .returning({ id: users.id, username: users.username }) // Ensure ID is returned correctly
                .then(res => res[0]); // Extract first row

            if (!user) {
                return {
                    success: false,
                    message: await getTranslation(lang, "userErr"),
                };
            }

            // Save shop to database and get the shop ID
            const shop = await mainDb.insert(shops)
                .values({
                    name: result[0].shopName,
                })
                .returning({ id: shops.id }) // Ensure ID is returned correctly
                .then(res => res[0]); // Extract first row

            if (!shop) {
                return {
                    success: false,
                    message: await getTranslation(lang, "shopCreateErr"),
                };
            }

            // Save to shop_users table
            const credetials = await mainDb.insert(shopUsers).values({
                shopId: shop.id,
                userId: user.id,
                role: "owner", // Since this is the shop creator
            }).returning({ userId: shopUsers.userId, shopId: shopUsers.shopId});
            
            // automatic login
            if (credetials.length === 0) return;

            const { userId, shopId } = credetials[0];
            // Generate JWT
            const jwtToken = await jwt.sign({ 
                userId,
                shopId
            });
    
            if (!jwtToken) {
                return {
                    success: false,
                    message: await getTranslation(lang, "noToken")
                };
            }
    
            // Set secure cookie
            auth_token.set({
                value: token,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'development' ? false : true,
                sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
                maxAge: 7 * 86400,
                path: '/',
                domain: process.env.NODE_ENV === 'development' 
                        ? undefined: ".mypostech.store"
            });

            return redirect(`${frontendURL}/private`, 302);
            
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error
                        ? error.message
                        : await getTranslation(lang, "serverErr")
            }
        }
    })

export default regPlugin