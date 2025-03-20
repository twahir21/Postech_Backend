import { mainDb } from "../database/schema/mainDb";
import { users } from "../database/schema/users";
import { sessions } from "../database/schema/sessions";
import { generateToken, comparePassword } from "../utils/auth";
import { eq } from "drizzle-orm";

export const loginUser = async (email: string, password: string) => {
    const user = await mainDb.select().from(users).where(eq(users.email, email)).execute();

    if (!user[0] || !(await comparePassword(password, user[0].password))) {
        throw new Error("Invalid credentials");
    }

    // Create New Session
    const session = await mainDb.insert(sessions).values({
        userId: user[0].id,
        token: "",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }).returning();

    const token = generateToken(user[0].id, session[0].id);

    // Update session with token
    await mainDb.update(sessions).set({ token }).where(eq(sessions.id, session[0].id));

    return { user: user[0], token };
};
