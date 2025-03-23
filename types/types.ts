// interfaces
export interface registerRequest {
    email?: string;
    username?: string;
    password?: string;
    name?: string;
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

export interface categoriesTypes {
    generalName?: string;
}

export interface suppTypes {
    company?: string;
    contact?: string;
}