export interface OrderItem {
  product: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  _id?: string;
  orderNumber: string;
  customer: string;
  status: 'pending' | 'processing' | 'ready_for_delivery' | 'in_delivery' | 'completed' | 'cancelled';
  items: OrderItem[];
  orderDate?: Date;
  totalValue?: number;
}
