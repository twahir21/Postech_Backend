import type { JWTPayloadSpec } from "@elysiajs/jwt";
import type { StatusMap } from "elysia";
import type { ElysiaCookie } from "elysia/cookies";
import type { HTTPHeaders } from "elysia/types";

// interfaces
export interface registerRequest {
    email: string;
    username: string;
    password: string;
    name: string;
    phoneNumber: string;
}

export interface productTypes {
    name?: string;
    priceBought?: number;
    priceSold?: number;
    stock?: number;
    minStock?: number;
    unit?: string;
    supplierId?: string;
    categoryId?: string;
}

export interface headTypes {
    [key: string]: string | undefined;
}

export interface categoriesTypes {
    generalName: string;
}

export interface suppTypes {
    company: string;
    contact: string;
}

export interface loginTypes {
    username?: string;
    password?: string;
}


export interface ProductQuery {
    search?: string;
    page?: string;
    limit?: string;
  }
  
export interface CustomerTypes {
    name: string;
    contact: string;
}

export interface QrData {
    calculatedTotal: number;
    quantity: number;
    saleType: string;
    discount: number;
    description: string;
    typeDetected: string;
    productId: string;
    priceSold: number;
    priceBought: number;
    supplierId: string;
    customerId: string;
}

export type SalesQuery = {
    search?: string;
    date?: string;
    page?: string;
    limit?: string;
    from?: string;
    to?: string;
  };

  
export type exportSet = {
        headers: HTTPHeaders;
        status?: number | keyof StatusMap;
        redirect?: string;
        cookie?: Record<string, ElysiaCookie>;
}


export interface shopTypes {
    email: string;
    shopName: string;
}

export interface pswdType {
    currentPassword: string;
    newPassword: string;
}


export interface DecodedToken {
    userId: string;
    shopId: string;
  }
  
  
export  interface CookieTypes {
      auth_token?: {
        value: string;
      };
  }

export  interface jwtTypes {
    readonly sign: (morePayload: Record<string, string | number> & JWTPayloadSpec) => Promise<string>;
    readonly verify: (jwt?: string) => Promise<false | (Record<string, string | number> & JWTPayloadSpec)>;
  }
