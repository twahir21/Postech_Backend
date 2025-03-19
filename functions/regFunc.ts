import { z } from "zod";
import type { registerRequest } from "../types/types"; 
import { hashPassword } from "./hash";
import { mainDb } from "../database/schema/mainDb";
import { users } from "../database/schema/users";
export const regPost = async ({ body } : { body: registerRequest }) => {
    try {
        // validation of data
        const schema = z.object({
            shopName: z.string().min(3, "ShopName must have atleast 3 characters"),
            username: z.string().min(3, "Username must have more than 3 characters"),
            email: z.string().email(),
            password: z.string().min(6, "Password must have atleast 6 characters")
        });

        const parsed = schema.safeParse(body);

        if(!parsed.success) {
            return {
                error: parsed.error.format(),
                success: false
            }
        }

        const { shopName, username, email, password } : registerRequest = parsed.data;
        
        // save to database
        await mainDb.insert(users).values({
            shopName,
            username,
            email,
            password, 
        });

        return {
            success: true,
            message: "User registered Successfully"
        }
        // save to database
    } catch (error) {
        if (error instanceof Error) {
            return {
                error: error.message,
                success: false
            }
        }else {
            return {
                error: "Server failed to process your request",
                success: false
            }
        }
    }
}