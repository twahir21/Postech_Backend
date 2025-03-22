import Elysia from "elysia";
import { mainDb } from "../database/schema/connections/mainDb"; // Import your database instance
import { users } from "../database/schema/users";  // Import users table

const usersRoute = new Elysia()
    .get("/users", async () => {
        try {
            const allUsers = await mainDb.select().from(users);
            if (allUsers.length === 0) {
                return {
                    success: false,
                    message: "Nothing to show from users"
                }
            }
            return {
                success: true,
                data: allUsers
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error"
            };
        }
    })

    .delete("/users", async () => {
        try {
            // Delete all users from the database
            const deletedUsers = await mainDb.delete(users).returning();
    
            if (deletedUsers.length === 0) {
                return {
                    success: false,
                    message: "No users found to delete"
                };
            }
    
            return {
                success: true,
                message: "All users deleted successfully",
                deletedUsers
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error"
            };
        }
    })
    
export default usersRoute;
