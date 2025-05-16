import type { headTypes, registerRequest } from "../types/types"; 
import { mainDb } from "../database/schema/connections/mainDb";
import { emailVerifications, shops, users } from "../database/schema/shop";
import { hashPassword } from "./security/hash";
import { getTranslation } from "./translation";
import { eq } from "drizzle-orm"; // Ensure this is imported for querying
import { sanitizeString } from "./security/xss";
import { shopCheckCache, userCheckCache } from "./utils/caches";
import { cacheStatsTracker } from "./utils/Stats";
import { v4 as uuidv4 } from 'uuid';
import nodemailer from "nodemailer";




export const regPost = async ({ body, headers }: { body: registerRequest; headers: headTypes }) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    const frontendURL = process.env.NODE_ENV  === 'development' 
                        ? process.env.FRONTEND_URL_DEV!
                        : process.env.FRONTEND_URL!;

    const zohoEmail = "huduma@mypostech.store";
    
    let transporter = nodemailer.createTransport({
        host: "smtp.zoho.com", 
        port: 465, // Use 465 for SSL or 587 for TLS
        secure: true, // true for 465 (SSL), false for 587 (TLS)
        auth: {
            user: zohoEmail,
            pass: process.env.ZOHO_APP_PASSWORD,
        },
    });
    

    try {

        let { name, username, email, password, phoneNumber } = body as registerRequest;

        // 🛡️ **Sanitize Inputs** (takes 3ms)
        name = sanitizeString(name.trim().toLowerCase());
        username = sanitizeString(username.trim().toLowerCase());
        email = sanitizeString(email.trim());
        password = sanitizeString(password.trim());
        phoneNumber = sanitizeString(phoneNumber.trim());
        
        // Check if the email or user is already registered
        // 🧠 Try memory cache first
        const [existingUserCached, existingShopCached] = await Promise.all([
            userCheckCache.get(`user:${email}`),
            shopCheckCache.get(`shop:${name}`),
        ]);

        if (existingUserCached) {
            cacheStatsTracker.recordHit('userCheckCache');
            return {
              success: false,
              message: await getTranslation(lang, "emailExistsErr")
            };
        }

        if (existingShopCached) {
            cacheStatsTracker.recordHit('shopCheckCache');
            return {
              success: false,
              message: await getTranslation(lang, "shopExistsErr")
            };
          }

        // 🚦 Run DB checks in parallel (avoid select() and run one per time)
        // 🔍 If not cached, fetch from DB
        // save is missed
        cacheStatsTracker.recordMiss('userCheckCache');
        cacheStatsTracker.recordMiss('shopCheckCache');

        const [existingUser, existingShop] = await Promise.all([
            mainDb.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1),
            mainDb.select({ id: shops.id }).from(shops).where(eq(shops.name, name)).limit(1)
        ]);
    
        if (existingUser.length > 0) {
            userCheckCache.set(`user:${email}`, { exists: true });
            return {
            success: false,
            message: await getTranslation(lang, "emailExistsErr")
            };
        }
    
        if (existingShop.length > 0) {
            shopCheckCache.set(`shop:${name}`, { exists: true });
            return {
            success: false,
            message: await getTranslation(lang, "shopExistsErr")
            };
        }
        // verify email
        // Step 1: generate token
        const token = uuidv4();

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Step 2: store in DB
        await mainDb.insert(emailVerifications).values({
            token,
            email: body.email,
            password: hashedPassword,
            phone: body.phoneNumber,
            shopName: body.name,
            username: body.username,
            expiresAt: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes from now
            used: false
        });


        // Step 3: send email with magic link
        const link = `${frontendURL}/verify-email?token=${token}`;

        await transporter.sendMail({
            from: `"PosTech" <${zohoEmail}>`,
            to: body.email,
            subject: "Hakiki barua pepe",
            html: `
            <!DOCTYPE html>
            <html lang="sw">
            <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>Thibitisha Barua Pepe</title>
            <style>
                body {
                font-family: 'Quicksand', sans-serif;
                background-color: #e2e8f0;
                padding: 1rem;
                color: #1f2937;
                font-size: 14px;
                margin: 0;
                }
                .container {
                max-width: 28rem;
                margin: 0 auto;
                background: white;
                border: 2px solid #334155;
                border-radius: 1.5rem;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                overflow: hidden;
                }
                .header {
                text-align: center;
                padding: 2rem 1.5rem;
                background: linear-gradient(to top, #5eead4, #115e59);
                }
                .header img {
                width: 5rem;
                margin: 0 auto 1rem;
                }
                .header h2 {
                color: white;
                font-size: 1.5rem;
                font-weight: 600;
                margin: 0;
                }
                .content {
                padding: 2rem 1.5rem;
                text-align: center;
                }
                .content p {
                margin-bottom: 1.5rem;
                font-size: 14px;
                }
                .content a {
                display: inline-block;
                padding: 0.75rem 1.5rem;
                border: 2px solid #334155;
                background-color: #bbf7d0;
                color: #111827;
                font-weight: bold;
                border-radius: 9999px;
                text-decoration: none;
                }
                .footer {
                margin-top: 2rem;
                font-size: 12px;
                color: #6b7280;
                }
            </style>
            </head>
            <body>
            <div class="container">
                <div class="header">
                    <img src="${frontendURL}/thumbail.png" alt="App Logo">
                    <h2>Thibitisha Barua Pepe Yako</h2>
                </div>
                <div class="content">
                <p>Habari! Tafadhali bonyeza kitufe hapa chini kuthibitisha anwani yako ya barua pepe 
                    <span style="color: #ef4444;">kabla ya dakika 20</span>.
                </p>
                <a href="${link}">Thibitisha Barua Pepe</a>
                <div class="footer">
                    <p>Ikiwa hukutuma ombi la akaunti au ujumbe huu, tafadhali puuza barua pepe hii.</p>
                </div>
                </div>
            </div>
            </body>
            </html>
            `
        });

        return {
            success: true,
            message: "Ingia kwenye email yako kuhakiki",
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error
                    ? error.message
                    : sanitizeString(await getTranslation(lang, "serverErr"))
        }
    }
};
