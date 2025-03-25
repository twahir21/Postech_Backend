// Define return type for extractId
interface ExtractedId {
    userId: string;
    shopId: string;
}

export const extractId = async ({ jwt, cookie }: { jwt: any; cookie: any }): Promise<ExtractedId> => {
    const token = cookie.auth?.value;
    if (!token) {
        throw new Error("Unauthorized - No token"); // Ensure error is thrown for missing token
    }

    const decoded = await jwt.verify(token);
    if (!decoded || !decoded.userId || !decoded.shopId) {
        throw new Error("Unauthorized - Invalid token");
    }

    return { userId: decoded.userId, shopId: decoded.shopId };
};
