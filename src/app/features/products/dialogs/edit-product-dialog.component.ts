import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '@core/services/product.service';
import { Product } from '@core/models/product.model';

@Component({
  selector: 'app-edit-product-dialog',
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
    <h2 mat-dialog-title>Edit Product</h2>
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
              (click)="updateProduct()">Update Product</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }
  `]
})
export class EditProductDialogComponent {
  productForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EditProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public product: Product,
    private fb: FormBuilder,
    private productService: ProductService
  ) {
    this.productForm = this.fb.group({
      _id: [product._id],
      name: [product.name, Validators.required],
      model: [product.model, Validators.required],
      manufacturer: [product.manufacturer, Validators.required],
      category: [product.category, Validators.required]
    });
  }

  updateProduct(): void {
    if (this.productForm.valid) {
      const updatedProduct: Product = this.productForm.value;
      this.productService.updateProduct(updatedProduct).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (error: Error) => {
          console.error('Error updating product', error);
          // TODO: Add error handling toast/snackbar
        }
      });
    }
  }
}
