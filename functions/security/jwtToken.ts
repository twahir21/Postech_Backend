import type { CookieTypes, DecodedToken,  jwtTypes } from "../../types/types";


export function isDecodedToken(token: unknown): token is DecodedToken {
    if (
      typeof token === 'object' &&
      token !== null
    ) {
      const t = token as Record<string, unknown>;
      return (
        typeof t.userId === 'string' &&
        typeof t.shopId === 'string'
      );
    }
  
    return false;
  }
  
  
  export const extractId = async ({ jwt, cookie }: { jwt: jwtTypes; cookie: CookieTypes })=> {
    const token = cookie.auth_token?.value;
    if (!token) {
      return {
        success: false,
        message: "Huna ruhusa! - hakuna token"
      }
    }
  
    const decoded = await jwt.verify(token);
  
    if (!isDecodedToken(decoded)) {
      return {
        success: false,
        message: "Huna ruhusa! - Token sio sahihi"
      }
    }
    const { userId, shopId } = decoded

    if (!shopId || !userId) {
      return {
        success: false,
        message: "shopId au userId haipo"
      }
    }
  
    // ✅ Now fully type-safe
    return { userId, shopId}
  };
  
