import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from '@core/services/order.service';
import { Order, OrderItem } from '@core/models/order.model';
import { ProductService } from '@core/services/product.service';
import { Product } from '@core/models/product.model';

@Component({
  selector: 'app-create-order-dialog',
  templateUrl: './create-order-dialog.component.html',
  styleUrls: ['./create-order-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule
  ]
})
export class CreateOrderDialogComponent implements OnInit {
  orderForm: FormGroup;
  products: Product[] = [];
  orderItems: OrderItem[] = [];

  constructor(
    private dialogRef: MatDialogRef<CreateOrderDialogComponent>,
    private fb: FormBuilder,
    private orderService: OrderService,
    private productService: ProductService
  ) {
    this.orderForm = this.fb.group({
      customer: ['', Validators.required],
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getAllProducts().subscribe(
      products => this.products = products,
      error => console.error('Error loading products', error)
    );
  }

  addOrderItem(): void {
    if (this.orderForm.valid) {
      const selectedProduct = this.products.find(p => p._id === this.orderForm.get('productId')?.value);
      
      if (selectedProduct) {
        const newItem: OrderItem = {
          product: selectedProduct.name,
          quantity: this.orderForm.get('quantity')?.value,
          unitPrice: selectedProduct.unitPrice
        };

        this.orderItems.push(newItem);
        this.orderForm.get('productId')?.reset();
        this.orderForm.get('quantity')?.setValue(1);
      }
    }
  }

  removeOrderItem(index: number): void {
    this.orderItems.splice(index, 1);
  }

  createOrder(): void {
    if (this.orderItems.length > 0) {
      const newOrder: Order = {
        customer: this.orderForm.get('customer')?.value,
        orderNumber: `ORD-${Date.now()}`, // Simple order number generation
        status: 'pending',
        orderDate: undefined, // Update order creation to use optional orderDate
        totalValue: undefined, // Update order creation to use optional totalValue
        items: this.orderItems
      };

      this.orderService.createOrder(newOrder).subscribe(
        createdOrder => {
          this.dialogRef.close(createdOrder);
        },
        error => {
          console.error('Error creating order', error);
          // TODO: Add error handling toast/snackbar
        }
      );
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  calculateTotalValue(): number {
    return this.orderItems.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  }
}
