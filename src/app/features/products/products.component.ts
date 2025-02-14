import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProductService } from '@core/services/product.service';
import { Product } from '@core/models/product.model';
import { AddProductDialogComponent } from './dialogs/add-product-dialog.component';
import { EditProductDialogComponent } from './dialogs/edit-product-dialog.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatPaginatorModule, 
    MatSortModule, 
    MatInputModule, 
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  template: `
    <div class="products-container">
      <h2>Product Catalog</h2>
      
      <div class="actions-row">
        <mat-form-field>
          <input matInput (keyup)="applyFilter($event)" placeholder="Search Products" #searchInput>
        </mat-form-field>
        
        <button mat-raised-button color="primary" (click)="openAddProductDialog()">
          <mat-icon>add</mat-icon> Add New Product
        </button>
      </div>

      <table mat-table [dataSource]="dataSource" matSort class="products-table">
        <!-- Columns -->
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Product Name</th>
          <td mat-cell *matCellDef="let product">{{ product.name }}</td>
        </ng-container>

        <ng-container matColumnDef="model">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Model</th>
          <td mat-cell *matCellDef="let product">{{ product.model }}</td>
        </ng-container>

        <ng-container matColumnDef="manufacturer">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Manufacturer</th>
          <td mat-cell *matCellDef="let product">{{ product.manufacturer }}</td>
        </ng-container>

        <ng-container matColumnDef="category">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Category</th>
          <td mat-cell *matCellDef="let product">{{ product.category }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let product">
            <button mat-icon-button color="primary" (click)="editProduct(product)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteProduct(product)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <mat-paginator 
        [pageSizeOptions]="[5, 10, 25, 100]" 
        showFirstLastButtons
        aria-label="Select page of products">
      </mat-paginator>
    </div>
  `,
  styles: [`
    .products-container {
      padding: 24px;
    }

    .actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .products-table {
      width: 100%;
    }
  `]
})
export class ProductsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['name', 'model', 'manufacturer', 'category', 'actions'];
  dataSource: MatTableDataSource<Product> = new MatTableDataSource<Product>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productService: ProductService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (products: Product[]) => {
        this.dataSource.data = products;
      },
      error: (error: Error) => {
        console.error('Error loading products', error);
        // TODO: Add error handling toast/snackbar
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openAddProductDialog(): void {
    const dialogRef = this.dialog.open(AddProductDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProducts();
      }
    });
  }

  editProduct(product: Product): void {
    const dialogRef = this.dialog.open(EditProductDialogComponent, {
      width: '500px',
      data: product
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProducts();
      }
    });
  }

  deleteProduct(product: Product): void {
    // TODO: Implement confirmation dialog
    this.productService.deleteProduct(product._id || '').subscribe({
      next: () => {
        this.loadProducts();
      },
      error: (error: Error) => {
        console.error('Error deleting product', error);
        // TODO: Add error handling toast/snackbar
      }
    });
  }
}
