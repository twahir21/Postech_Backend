// Define return type for extractId
interface ExtractedId {
    userId: string;
    shopId: string;
}

export const extractId = async ({ jwt, cookie }: { jwt: any; cookie: any }): Promise<ExtractedId> => {
    const token = cookie.auth_token?.value;
    if (!token) {
        throw new Error("Unauthorized - No token"); // Ensure error is thrown for missing token
    }

    const decoded = await jwt.verify(token);
    if (!decoded || !decoded.userId || !decoded.shopId) {
        throw new Error("Unauthorized - Invalid token");
    }

    return { userId: decoded.userId, shopId: decoded.shopId };
};

// Function to delete the auth_token cookie
export default async function deleteAuthTokenCookie(cookie: any): Promise<void> {
    try {
        // Set the cookie value to an empty string and set its expiration date to the past
        cookie.auth_token.set({
            value: '', // Empty value to delete the cookie
            httpOnly: true, // prevents JavaScript from accessing it
            secure: true, // send over HTTPS only
            sameSite: 'none', // for cross-origin requests
            maxAge: 0, // Expire the cookie immediately
            path: '/', // Path where the cookie is accessible
            domain: '.mypostech.store', // Domain for the cookie
        });

    } catch (error) {
        console.error("Error deleting the auth token cookie:", error);
        throw new Error("Failed to delete the auth token cookie.");
    }
};