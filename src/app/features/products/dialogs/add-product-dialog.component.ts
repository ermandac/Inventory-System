import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '@core/services/product.service';
import { Product } from '@core/models/product.model';

@Component({
  selector: 'app-add-product-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatInputModule, 
    MatFormFieldModule, 
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  template: `
    <h2 mat-dialog-title>Add New Product</h2>
    <mat-dialog-content>
      <form [formGroup]="productForm">
        <mat-form-field>
          <input matInput placeholder="Product Name" formControlName="name" required>
          <mat-error *ngIf="productForm.get('name')?.invalid">Product Name is required</mat-error>
        </mat-form-field>

        <mat-form-field>
          <input matInput placeholder="Model" formControlName="model" required>
          <mat-error *ngIf="productForm.get('model')?.invalid">Model is required</mat-error>
        </mat-form-field>

        <mat-form-field>
          <input matInput placeholder="Manufacturer" formControlName="manufacturer" required>
          <mat-error *ngIf="productForm.get('manufacturer')?.invalid">Manufacturer is required</mat-error>
        </mat-form-field>

        <mat-form-field>
          <input matInput placeholder="Category" formControlName="category" required>
          <mat-error *ngIf="productForm.get('category')?.invalid">Category is required</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-raised-button color="primary" 
              [disabled]="productForm.invalid" 
              (click)="addProduct()">Add Product</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }
  `]
})
export class AddProductDialogComponent {
  productForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<AddProductDialogComponent>,
    private fb: FormBuilder,
    private productService: ProductService
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      model: ['', Validators.required],
      manufacturer: ['', Validators.required],
      category: ['', Validators.required]
    });
  }

  addProduct(): void {
    if (this.productForm.valid) {
      const newProduct: Product = this.productForm.value;
      this.productService.createProduct(newProduct).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (error: Error) => {
          console.error('Error adding product', error);
          // TODO: Add error handling toast/snackbar
        }
      });
    }
  }
}
