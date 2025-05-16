import { Elysia } from "elysia";
import { redirect } from "elysia";
import { mainDb } from "../database/schema/connections/mainDb";
import { shops, shopUsers, users } from "../database/schema/shop";
import { eq } from "drizzle-orm";
import { getTranslation } from "../functions/translation";
import { hashPassword } from "../functions/security/hash";
import { randomBytes } from 'crypto';
import cookie from "@elysiajs/cookie";
import jwt from "@elysiajs/jwt";


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

const backendURL = process.env.NODE_ENV === 'development'
                    ? process.env.BACKEND_URL_DEV!
                    : process.env.BACKEND_URL!

const frontendURL = process.env.NODE_ENV === 'development'
                    ? process.env.FRONTEND_URL_DEV!
                    : process.env.FRONTEND_URL!

const REDIRECT_URI = `${backendURL}/auth/google/callback`;


const JWT_SECRET = process.env.JWT_TOKEN || "something@#morecomplicated<>es>??><Ess5%";

const googlePlugin = new Elysia()
    .use(cookie()) // Use cookie plugin
    .use(
        jwt({
            name: 'jwt',
            secret: JWT_SECRET,  // Secret for JWT
        })
    )
  .get("/auth/google", () => {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "email profile openid");

    return redirect(url.toString(), 302);
  })

  .get("/auth/google/callback", async ({ query, headers, jwt, cookie: { auth_token } }) => {
    const code = query.code;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const lang = headers["accept-language"]?.split(",")[0] || "sw";

    try {
      const { access_token, id_token } = await tokenRes.json();

      const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      }).then(res => res.json());
  
      // ⬇️ Upsert user into your DB, then create a session token
      const { email, name, picture, sub: googleId } = userInfo;
  
      // check if user is not in the system
      const isNew = await mainDb.select({ email: users.email})
                        .from(users).where(eq(users.email, email));

      if (isNew.length === 0) {
    
        /* 
        $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
         ------------------------------
          PERFORM REGISTRATION APPROACH
         ------------------------------
         $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
        */

        const generateShopName = (name: string) => {
          const base = name.trim().split(' ')[0];
          const suffix = Math.floor(Math.random() * 10000);
          return `${base}'s Shop_${suffix}`; // e.g., John's Shop_4567
        };
        const generatePassword = () => randomBytes(6).toString('base64').slice(0, 7);
        const generateUsername = (name: string) => {
          const base = name.trim().split(' ')[0];
          const suffix = Math.floor(Math.random() * 1000);
          return `${base}'_${suffix}`; // e.g., John_457
        };
        const generatePhone = () => {
          const preffix = '255';
          const generateUnique10Digit = (() => {
            const usedNumbers = new Set<string>();
          
            return () => {
              let num: string;
          
              do {
                // Generate a random 10-digit number as string
                num = (Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000).toString();
              } while (usedNumbers.has(num));
          
              usedNumbers.add(num);
          
              return num;
            };
          })();
          return preffix + generateUnique10Digit()
        }


        const shopName = generateShopName(name);
        const password = generatePassword();
        const hashedPassword = await hashPassword(password);
        const username = generateUsername(name);
        const phoneNumber = generatePhone();

        // Save user to database and get the user ID
        const user = await mainDb.insert(users)
            .values({
                username,
                email,
                password: hashedPassword,
                phoneNumber
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
                name: shopName,
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
            value: jwtToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'development' ? false : true,
            sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
            maxAge: 7 * 86400,
            path: '/',
            domain: process.env.NODE_ENV === 'development' 
                    ? undefined: ".mypostech.store"
        });
  
        return redirect(`${frontendURL}/private`, 302);

      }else{
        /* 
        ##############################
         ------------------------------
          PERFORM LOGIN APPROACH
         ------------------------------
         ###############################
        */
        const userDetails = await mainDb.select({
          userId: users.id,
          username: users.username
        }).from(users).where(eq(users.email, email));

        const userId = userDetails[0].userId;
        const shopDetails = await mainDb.select({
          shopId: shopUsers.shopId
        }).from(shopUsers).where(eq(shopUsers.userId, userId));

        const shopId = shopDetails[0].shopId;

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
            value: jwtToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'development' ? false : true,
            sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
            maxAge: 7 * 86400,
            path: '/',
            domain: process.env.NODE_ENV === 'development' 
                    ? undefined: ".mypostech.store"
        });

        return redirect(`${frontendURL}/private`, 302);
      }
  

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error 
                ? error.message
                : "Google failed"
      }
    }
  })

  .post('/verify-captcha', async ({ body }: { body: { token: string } }) => {
    const token = body.token;

    if (!token) {
      return {
        success: false,
        message: "Tokeni ya reCAPTCHA haipo! jaribu tena"
      }
    }
    
    try {
      const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          secret: process.env.GOOGLE_RECAPTCHA_SECRET_KEY!, // Secret key from Google
          response: token
        }).toString()
      });
    
      const result = await res.json();
    
      if (result.success) {
        // Passed the captcha
        return { success: true, message: "Success" };
      } else {
        return { success: false, message: result['error-codes'] };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error 
                ? error.message
                : "Imeshindwa kuhakiki reCAPTCHA!"
      }
    }
  })
  
export default googlePlugin;