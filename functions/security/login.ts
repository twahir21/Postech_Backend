import { Elysia } from "elysia";
import { logFailedLogin } from "../utils/logger"; // Import logger
import { mainDb } from "../db"; // Your Drizzle DB
import { users } from "../db/schema"; // Your users table
import { eq } from "drizzle-orm";
import { verifyPassword } from "../utils/hash"; // Function to check password

export const authPlugin = new Elysia()
    .post("/login", async ({ body, request, set }) => {
        const { email, password } = body;
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown-ip";

        const user = await mainDb.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user.length || !(await verifyPassword(password, user[0].password))) {
            await logFailedLogin(email, ip); // Log failed attempt
            set.status = 401;
            return { success: false, message: "Invalid email or password" };
        }

        return { success: true, message: "Login successful" };
    });
