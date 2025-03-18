import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export function connectToUserDb(userDbName: string) {
    const userDbUrl = `postgres://postgres:yourpassword@localhost:5432/${userDbName}`;
    return drizzle(postgres(userDbUrl));
}
