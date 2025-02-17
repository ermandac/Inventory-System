import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';

import { ProductService } from '../../../../core/services/product.service';
import { OrderService } from '../../../../core/services/order.service';
import { Order, OrderItem } from '../../../../core/models/order.model';
import { Product } from '../../../../core/models/product.model';

import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

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
  currentDate: Date = new Date();
  private _orderNumber: string | null = null;

  // Use MatTableDataSource for the order items
  orderItemsDataSource = new MatTableDataSource<FormGroup>([]);

  constructor(
    private dialogRef: MatDialogRef<CreateOrderDialogComponent>,
    private fb: FormBuilder,
    private productService: ProductService,
    private orderService: OrderService,
    private snackBar: MatSnackBar
  ) {
    // Configure dialog size to be larger
    this.dialogRef.updateSize('90%', '90%');

    this.orderForm = this.fb.group({
      customer: ['', [Validators.required, Validators.minLength(2)]],
      product: [null],
      items: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });

    // Generate order number on initialization
    this._orderNumber = this.generateOrderNumber();
  }

  ngOnInit(): void {
    this.productService.getAllProducts().subscribe(
      products => {
        // Fetch stock information for each product
        this.products = products.map(product => ({
          ...product,
          // Placeholder for stock information, will be fetched dynamically
          availableStock: 0
        }));

        // Fetch stock information for each product
        this.products.forEach(product => {
          this.productService.getProductStock(product._id).subscribe(
            stockInfo => {
              // Update the product with stock information
              Object.assign(product, stockInfo);
            },
            error => {
              console.error(`Error fetching stock for product ${product._id}`, error);
            }
          );
        });
      },
      error => {
        this.snackBar.open('Failed to load products', 'Close', { duration: 3000 });
      }
    );
  }

  get itemsFormArray(): FormArray {
    return this.orderForm.get('items') as FormArray;
  }

  // Getter for the data source
  get orderItems(): MatTableDataSource<FormGroup> {
    // Ensure the data source is updated with current form array controls
    this.orderItemsDataSource.data = this.itemsFormArray.controls as FormGroup[];
    return this.orderItemsDataSource;
  }

  generateOrderNumber(): string {
    // Use a more comprehensive approach to generate unique order number
    const prefix = 'ORD';
    const timestamp = new Date().getTime();
    const randomComponent = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const uniqueId = `${prefix}-${timestamp}-${randomComponent}`;
    
    console.log('Generated Order Number:', uniqueId);
    return uniqueId;
  }

  stableOrderNumber(): string {
    // If order number doesn't exist, generate a new one
    // If it already exists, return the existing number
    if (!this._orderNumber) {
      this._orderNumber = this.generateOrderNumber();
    }
    return this._orderNumber;
  }

  createOrderItemForm(product: Product): FormGroup {
    // Ensure we have a valid product with stock information
    const availableStock = 
      product.availableItems || 
      product.availableStock || 
      product.totalItems || 
      0;

    return this.fb.group({
      product: [product._id || null, Validators.required],
      productName: [product.name || '', Validators.required],
      quantity: [1, [
        Validators.required, 
        Validators.min(1),
        Validators.max(availableStock)
      ]],
      unitPrice: [product.unitPrice || 0, Validators.required],
      totalPrice: [product.unitPrice || 0, Validators.required],
      availableStock: [availableStock, Validators.required],
      availableItems: [availableStock, Validators.required]
    });
  }

  addOrderItem(): void {
    const selectedProductId = this.orderForm.get('product')?.value;

    // Validate product selection
    if (!selectedProductId) {
      this.snackBar.open('Please select a product', 'Close', { duration: 3000 });
      return;
    }

    // Find the full product object
    const selectedProduct = this.products.find(p => p._id === selectedProductId);

    if (!selectedProduct) {
      this.snackBar.open('Selected product not found', 'Close', { duration: 3000 });
      return;
    }

    // Check if product is already in the order
    const existingItemIndex = this.itemsFormArray.controls.findIndex(
      control => control.get('product')?.value === selectedProductId
    );

    if (existingItemIndex !== -1) {
      this.snackBar.open('Product already added to the order', 'Close', { duration: 3000 });
      return;
    }

    // Fetch current stock information before adding the order item
    this.productService.getProductStock(selectedProductId).subscribe(
      stockInfo => {
        // Update the product with the latest stock information
        const updatedProduct = { 
          ...selectedProduct, 
          ...stockInfo,
          availableItems: stockInfo.availableItems || 0,
          availableStock: stockInfo.availableItems || 0,
          totalItems: stockInfo.totalItems || 0
        };

        // Create order item form with updated stock
        const newItem = this.createOrderItemForm(updatedProduct);
        this.itemsFormArray.push(newItem);

        // Manually update the data source
        this.orderItemsDataSource.data = [...this.itemsFormArray.controls] as FormGroup[];
        
        // Reset product selection
        this.orderForm.get('product')?.reset();
      },
      error => {
        console.error(`Error fetching stock for product ${selectedProductId}`, error);
        this.snackBar.open('Failed to fetch product stock', 'Close', { duration: 3000 });
      }
    );
  }

  removeOrderItem(index: number): void {
    this.itemsFormArray.removeAt(index);
    
    // Manually update the data source
    this.orderItemsDataSource.data = [...this.itemsFormArray.controls] as FormGroup[];
  }

  updateTotalPrice(index: number): void {
    const orderItemForm = this.itemsFormArray.at(index) as FormGroup;
    const quantity = orderItemForm.get('quantity')?.value;
    const unitPrice = orderItemForm.get('unitPrice')?.value;
    
    orderItemForm.get('totalPrice')?.setValue(quantity * unitPrice);
  }

  calculateSubtotal(): number {
    return this.itemsFormArray.controls.reduce((total, item) => {
      return total + (item.get('quantity')?.value * item.get('unitPrice')?.value);
    }, 0);
  }

  calculateTax(): number {
    return this.calculateSubtotal() * 0.1; // 10% tax
  }

  calculateTotalValue(): number {
    return this.calculateSubtotal() + this.calculateTax();
  }

  createOrder(): void {
    if (this.orderForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    // Get the stable order number
    const orderNumber = this.stableOrderNumber();

    // Prepare order items with type-safe OrderItem
    const orderItems: OrderItem[] = this.itemsFormArray.controls.map(item => ({
      product: item.get('product')?.value,
      quantity: item.get('quantity')?.value,
      unitPrice: item.get('unitPrice')?.value,
      itemStatus: 'inventory' as const, // Type-safe status
      assignedItems: [] // Empty array by default
    }));

    // Prepare order payload with correct type
    const orderPayload: Order = {
      orderNumber: orderNumber, // Use the stable order number
      customer: null, // Will be set by backend based on authenticated user
      items: orderItems,
      status: 'pending', // Use lowercase status
      orderDate: new Date(), // Add current date
      totalValue: this.calculateTotalValue() // Calculate total value
    };

    // Create the order
    this.orderService.createOrder(orderPayload).subscribe(
      response => {
        this.snackBar.open('Order created successfully', 'Close', { duration: 3000 });
        // Reset order number after successful creation
        this._orderNumber = null;
        this.dialogRef.close(response);
      },
      error => {
        console.error('Order creation error:', error);
        this.snackBar.open(
          `Failed to create order: ${error.error?.message || 'Unknown error'}`, 
          'Close', 
          { duration: 5000 }
        );
      }
    );
  }

  cancel(): void {
    this.dialogRef.close();
  }

  // Tracking function for performance
  trackOrderItemById(index: number, item: FormGroup): string {
    return item.get('product')?.value;
  }
}
