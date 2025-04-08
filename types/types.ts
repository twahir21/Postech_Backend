// interfaces
export interface registerRequest {
    email?: string;
    username?: string;
    password?: string;
    name?: string;
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
    generalName?: string;
}

export interface suppTypes {
    company?: string;
    contact?: string;
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
    name?: string;
    contact?: string;
}

export interface QrData {
    calculatedTotal: number;
    quantity: number;
    saleType: string;
    discount: number;
    description: string;
    typeDetected: string;
    productId: string;
}