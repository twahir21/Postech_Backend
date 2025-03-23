import { z } from "zod";
import type { headTypes, registerRequest } from "../types/types"; 
import { mainDb } from "../database/schema/connections/mainDb";
import { shops, shopUsers, users } from "../database/schema/shop";
import { hashPassword } from "./security/hash";
import { getTranslation } from "./translation";
import { eq } from "drizzle-orm"; // Ensure this is imported for querying

export const regPost = async ({ body, headers }: { body: registerRequest; headers: headTypes }) => {
    const lang = headers["accept-language"]?.split(",")[0] || "en";

    try {
        // Validation of data
        const schema = z.object({
            name: z.string().min(3, await getTranslation(lang, "shopErr")),
            username: z.string().min(3, await getTranslation(lang, "usernameErr")),
            email: z.string().email(),
            password: z.string().min(6, await getTranslation(lang, "passErr")),
        });

        const parsed = schema.safeParse(body);

        if (!parsed.success) {
            return {
                message: parsed.error.format(),
                success: false,
            };
        }

        const { name, username, email, password }: registerRequest = parsed.data;

        // Check if the email is already registered
        const existingUser = await mainDb.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingUser.length > 0) {
            return {
                success: false,
                message: await getTranslation(lang, "emailExistsErr"),
            };
        }

        // Check if the shop name is already registered
        const existingShop = await mainDb.select().from(shops).where(eq(shops.name, name)).limit(1);
        if (existingShop.length > 0) {
            return {
                success: false,
                message: await getTranslation(lang, "shopExistsErr"),
            };
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Save user to database and get the user ID
        const user = await mainDb.insert(users)
            .values({
                username,
                email,
                password: hashedPassword,
            })
            .returning({ id: users.id }) // Ensure ID is returned correctly
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
                name,
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
        await mainDb.insert(shopUsers).values({
            shopId: shop.id,
            userId: user.id,
            role: "owner", // Since this is the shop creator
        });

        return {
            success: true,
            message: await getTranslation(lang, "regMessage"),
        };
    } catch (error) {
        if (error instanceof Error) {
            return {
                message: error.message,
                success: false,
            };
        } else {
            return {
                message: await getTranslation(lang, "serverErr"),
                success: false,
            };
        }
    }
};
