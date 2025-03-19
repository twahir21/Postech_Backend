import passport from "passport";
import { mainDb } from "../database/schema/mainDb";
import { users } from "../database/schema/users";
import { eq } from "drizzle-orm";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";


passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: process.env.GOOGLE_REDIRECT_URI!,
        },
        async (accessToken, refreshToken, profile, done) => {
            // Extract user info
            const { id, displayName, emails } = profile;
            const email = emails?.[0]?.value;

            if (!email) return done(new Error("No email found"), null);

            // Check if user exists in DB
            const existingUser = await mainDb
                .select()
                .from(users)
                .where(eq(users.email, email));

            if (existingUser.length > 0) {
                return done(null, existingUser[0]);
            }

            // Register new user
            const newUser = await mainDb.insert(users).values({
                username: displayName,
                email,
                password: "", // No password for OAuth users
                shopName: "", // They can create a shop later
            }).returning();

            return done(null, newUser[0]);
        }
    )
);