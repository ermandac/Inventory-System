import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OrderItem {
  product: string;
  quantity: number;
  unitPrice: number;
  itemStatus?: 'inventory' | 'reserved' | 'delivery' | 'demo' | 'returned';
  assignedItems?: string[];
}

export interface Order {
  _id?: string;
  orderNumber: string;
  customer: string | null;
  status: 'pending' | 'processing' | 'ready_for_delivery' | 'in_delivery' | 'completed' | 'cancelled';
  items: OrderItem[];
  orderDate: Date;
  deliveryDate?: Date;
  totalValue?: number;
  forecastingMetadata?: {
    seasonalityFactor?: number;
    predictedDemand?: number;
    historicalDemandTrend?: number[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  createOrder(order: Order): Observable<Order> {
    // Ensure all required fields are present and type-safe
    const orderPayload: Order = {
      orderNumber: order.orderNumber,
      customer: order.customer,
      status: order.status,
      items: order.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        itemStatus: item.itemStatus || 'inventory',
        assignedItems: item.assignedItems || []
      })),
      orderDate: order.orderDate || new Date(),
      totalValue: order.totalValue
    };

    return this.http.post<Order>(`${this.apiUrl}`, orderPayload);
  }

  getOrders(filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Observable<Order[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
    }

    return this.http.get<Order[]>(this.apiUrl, { params });
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  updateOrderStatus(id: string, status: Order['status']): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteOrder(orderId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${orderId}`);
  }

  calculateOrderTotal(items: OrderItem[]): number {
    return items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  }

  formatCurrency(amount: number): string {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
