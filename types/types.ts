// interfaces
export interface registerRequest {
    email?: string;
    username?: string;
    password?: string;
    shopName?: string;
}

export interface productTypes {
    name?: string;
    company?: string;
    priceBought?: number;
    priceSold?: number;
    stock?: number;
    minStock?: number;
}

export interface headTypes {
    [key: string]: string | undefined;
}
