
//  JWT
import {OrderStatus} from "@prisma/client";

type TokenObj = {
    userId: number | string;
    userName: string;
    email?: string;
    role?: string;
};

// auth context
export interface UserAuthPayload {
    userID: string;
    role: any;
}

//orders
export interface SearchOrderQuery {
    shippingAddress?: string
    deliveryMethod?: string
    status?: OrderStatus
    minPrice?: string
    maxPrice?: string
    minItems?: string
    maxItems?: string
    startDate?: string
    endDate?: string
    userID?: string
    page?: string
    limit?: string
}

//products
export interface SearchProductQuery {
    searchTerm?: string
    category?: string
    minPrice?: string
    maxPrice?: string
    inStock?: string
    sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest'
    page?: string
    limit?: string
    minRating?: string
    maxRating?: string
    brand?: string
}

