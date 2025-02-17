export interface OrderItem {
  product: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  _id?: string;
  orderNumber: string;
  customer: string | null; 
  status: 'pending' | 'processing' | 'ready_for_delivery' | 'in_delivery' | 'completed' | 'cancelled';
  items: {
    product: string; 
    quantity: number;
    unitPrice: number;
    itemStatus?: 'inventory' | 'reserved' | 'delivery' | 'demo' | 'returned';
    assignedItems?: string[]; 
  }[];
  orderDate: Date;
  deliveryDate?: Date;
  totalValue?: number;
  forecastingMetadata?: {
    seasonalityFactor?: number;
    predictedDemand?: number;
    historicalDemandTrend?: number[];
  };
}
