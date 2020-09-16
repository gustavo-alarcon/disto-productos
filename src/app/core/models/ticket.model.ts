import { Product } from './product.model';

export interface Ticket {
    id?: string;
    index: number;
    productList: Array<{
        product: Product;
        quantity: number;
    }>;
    total: number;
    status?: string;
}