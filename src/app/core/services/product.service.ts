import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Product {
  _id?: string;
  sku: string;
  name: string;
  model: string;
  manufacturer: string;
  category: string;
  unitPrice: number;
  availableStock?: number;  // Now calculated dynamically
  description?: string;
  specifications?: string[];
  certifications?: string[];
  technicalDetails?: Record<string, any>;
  maintenanceSchedule?: string;
  warranty?: string;
  documentation?: string;
  support?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  // Get all products with stock information
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}`);
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${product._id}`, product);
  }

  deleteProduct(productId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${productId}`);
  }

  // Fetch comprehensive stock information for a product
  getProductStock(productId: string): Observable<{
    availableItems: number;
    reservedItems: number;
    deliveryItems: number;
    demoItems: number;
    returnedItems: number;
    soldItems: number;
    totalItems: number;
  }> {
    return this.http.get<{
      availableItems: number;
      reservedItems: number;
      deliveryItems: number;
      demoItems: number;
      returnedItems: number;
      soldItems: number;
      totalItems: number;
    }>(`${this.apiUrl}/${productId}/stock`);
  }

  // Remove deprecated stock calculation method
  calculateTotalReferencedQuantity(productId: string): Observable<number> {
    // Temporary method to maintain backwards compatibility
    return this.getProductStock(productId).pipe(
      map(stockInfo => stockInfo.reservedItems + stockInfo.deliveryItems)
    );
  }

  // Alternatively, if you want to do this client-side (less efficient):
  private calculateLocalReferencedQuantity(productId: string): Observable<number> {
    // Fetch all orders and filter those with the product
    return forkJoin([
      this.http.get<any[]>(`${environment.apiUrl}/orders`),
      this.http.get<any[]>(`${environment.apiUrl}/draft-orders`) // Assuming you have draft orders
    ]).pipe(
      map(([orders, draftOrders]) => {
        const allOrders = [...orders, ...draftOrders];
        
        // Sum up the quantities of the specified product across all orders
        const totalReferenced = allOrders.reduce((total, order) => {
          const productQuantity = order.items
            .filter(item => item.product === productId)
            .reduce((sum, item) => sum + item.quantity, 0);
          
          return total + productQuantity;
        }, 0);
        
        return totalReferenced;
      }),
      catchError(error => {
        console.error('Error calculating referenced quantity', error);
        return of(0);
      })
    );
  }
}
