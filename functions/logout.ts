import { eq } from "drizzle-orm";
import { mainDb } from "../database/schema/connections/mainDb";
import { sessions } from "../database/schema/sessions";

export const logoutUser = async (sessionId: string) => {
    await mainDb.delete(sessions).where(eq(sessions.id, sessionId));
};
