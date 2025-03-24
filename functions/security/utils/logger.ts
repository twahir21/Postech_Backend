import { writeFile } from "fs/promises";
import { resolve } from "path";

// Resolve log file path
const logFilePath = resolve("./logs/failed-logins.log");

export async function logFailedLogin(email: string, ip: string) {
    const logEntry = `${new Date().toISOString()} - Failed login: ${email} from ${ip}\n`;
    try {
        await writeFile(logFilePath, logEntry, { flag: "a" });
    } catch (error) {
        console.error("Failed to write log:", error);
    }
}
