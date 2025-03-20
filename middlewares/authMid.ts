import { verifyToken } from "../utils/auth";
import { mainDb } from "../database/schema/connections/mainDb";
import { sessions } from "../database/schema/sessions";
import { eq } from "drizzle-orm";

export const authMiddleware = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ message: "Invalid token" });
    }

    // Check if session exists in DB
    const session = await mainDb.select().from(sessions).where(eq(sessions.id, decoded.sessionId)).execute();

    if (!session[0]) {
        return res.status(403).json({ message: "Session expired, please log in again" });
    }

    req.userId = decoded.userId;
    req.sessionId = decoded.sessionId;
    next();
};
