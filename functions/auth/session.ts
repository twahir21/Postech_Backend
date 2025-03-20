import { mainDb } from "../database/schema/mainDb";
import { users } from "../database/schema/users";
import { sessions } from "../database/schema/sessions";
import { generateToken, hashPassword } from "../utils/auth";
import { eq } from "drizzle-orm";

export const registerUser = async (shopName: string, username: string, email: string, password: string) => {
    const hashedPassword = await hashPassword(password);

    // Create User
    const newUser = await mainDb.insert(users).values({
        shopName,
        username,
        email,
        password: hashedPassword
    }).returning();

    if (!newUser[0]) throw new Error("User registration failed");

    // Create Session
    const session = await mainDb.insert(sessions).values({
        userId: newUser[0].id,
        token: "",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiration
    }).returning();

    const token = generateToken(newUser[0].id, session[0].id);

    // Update session with token
    await mainDb.update(sessions).set({ token }).where(eq(sessions.id, session[0].id));

    return { user: newUser[0], token };
};
