
export const rateLimitMiddleware = async ({ request, set }: { request: Request; set: any }) => {
    const rateLimitMap = new Map<string, { count: number; reset: number }>();

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown-ip";
    const limit = 15; // Max 15 requests per minute
    const resetTime = 60 * 1000; // 1 minute

    const now = Date.now();
    const entry = rateLimitMap.get(ip) || { count: 0, reset: now + resetTime };

    if (now > entry.reset) {
        entry.count = 0;
        entry.reset = now + resetTime;
    }

    if (entry.count >= limit) {
        set.status = 429;
        return { success: false, message: "Too many requests. Please try again later." };
    }

    entry.count++;
    rateLimitMap.set(ip, entry);
};