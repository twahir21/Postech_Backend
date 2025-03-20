import argon2 from "argon2";

export async function hashPassword(password: string) {
    try {
        const hash = await argon2.hash(password, {
            type: argon2.argon2id, // Best for general-purpose use
            memoryCost: 2 ** 16,   // 64MB RAM (Higher = more secure)
            timeCost: 12,           // Number of iterations
            parallelism: 2         // Parallel processing (Adjust for CPU)
        });
        return hash;
    } catch (err) {
        console.error("Error hashing password:", err);
    }
}
