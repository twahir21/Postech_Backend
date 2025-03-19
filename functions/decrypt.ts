import argon2 from "argon2";
async function verifyPassword(storedHash: string, password: string) {
    try {
        const isMatch = await argon2.verify(storedHash, password);
        console.log("Password Match:", isMatch);
        return isMatch;
    } catch (err) {
        console.error("Error verifying password:", err);
    }
}

// Example Usage
verifyPassword("$argon2id$v=19$m=65536,t=12,p=2$456rsSRMWzeKRAzxqiD72Q$0JJfe3VDGaDMquh8ExDfQPVyEYef4veSgyU7hMt1rO0", "hassan123");
