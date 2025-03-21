import { z } from "zod";
import type { headTypes, registerRequest } from "../types/types"; 
import { mainDb } from "../database/schema/connections/mainDb";
import { users } from "../database/schema/users";
import { hashPassword } from "./security/hash";
import { getTranslation } from "./translation";

export const regPost = async ({ body, headers} : { body: registerRequest, headers: headTypes }) => {
    const lang = headers["accept-language"]?.split(",")[0] || "en";

    try {
        // validation of data
        const schema = z.object({
            shopName: z.string().min(3, await getTranslation(lang, "shopErr")),
            username: z.string().min(3, await getTranslation(lang, "usernameErr")),
            email: z.string().email(),
        password: z.string().min(6, await getTranslation(lang, "passErr"))
        });

        const parsed = schema.safeParse(body);

        if(!parsed.success) {
            return {
                error: parsed.error.format(),
                success: false
            }
        }

        const { shopName, username, email, password } : registerRequest = parsed.data;

        // hash the password
        const hashedPassword = await hashPassword(password); // the function returns a string so const is always string

        // save to database
        await mainDb.insert(users).values({
            shopName,
            username,
            email,
            password: hashedPassword // always returns a string so no worries to errors,
        });

        return {
            success: true,
            message: getTranslation(lang, "regMessage"),
        }
        
    } catch (error) {
        if (error instanceof Error) {
            return {
                error: error.message,
                success: false
            }
        }else {
            return {
                error: getTranslation(lang, "serverErr"),
                success: false
            }
        }
    }
}