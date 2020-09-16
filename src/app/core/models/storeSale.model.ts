import { Ticket } from './ticket.model';
import { User } from './user.model';

export interface StoreSale {
    id: string;
    correlative: number;
    ticket: Ticket;
    payment: number;
    paymentMethod?: PaymentType;
    status: string;
    failedItems?: Array<number>;
    rightItems?: Array<number>;
    createdAt: Date;
    createdBy: User;
}

export interface PaymentType {
    account: string;
    name: string;
    photoPath: string;
    photoURL: string;
}