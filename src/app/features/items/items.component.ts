import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { Item } from '../../core/models/item.interface';
import { ItemsService, InventoryReport } from '../../core/services/items.service';
import { AddItemDialogComponent } from './dialogs/add-item-dialog.component';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule
  ],
  template: `
    <div class="items-container">
      <div class="filters">
        <mat-form-field>
          <mat-label>Filter</mat-label>
          <input matInput (keyup)="applyFilter($event)" placeholder="Search items...">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Status</mat-label>
          <mat-select [(value)]="selectedStatus" (selectionChange)="filterByStatus()">
            <mat-option value="all">All</mat-option>
            <mat-option value="inventory">In Inventory</mat-option>
            <mat-option value="demo">In Demo</mat-option>
            <mat-option value="delivery">In Delivery</mat-option>
            <mat-option value="maintenance">In Maintenance</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Sort By</mat-label>
          <mat-select [(value)]="selectedSort" (selectionChange)="applySorting()">
            <mat-option value="serialNumber">Serial Number</mat-option>
            <mat-option value="productName">Product Name</mat-option>
            <mat-option value="status">Status</mat-option>
            <mat-option value="lastMaintenance">Last Maintenance</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-raised-button color="primary" (click)="openAddItemDialog()">
          <mat-icon>add</mat-icon>
          Add Item
        </button>

        <button mat-raised-button color="accent" (click)="exportInventoryReport()">
          <mat-icon>download</mat-icon>
          Export Report
        </button>
      </div>

      <div class="alerts" *ngIf="maintenanceDueItems.length > 0 || warrantyExpiringItems.length > 0">
        <div class="alert maintenance" *ngIf="maintenanceDueItems.length > 0">
          <mat-icon>build</mat-icon>
          {{ maintenanceDueItems.length }} items due for maintenance
        </div>
        <div class="alert warranty" *ngIf="warrantyExpiringItems.length > 0">
          <mat-icon>warning</mat-icon>
          {{ warrantyExpiringItems.length }} items with expiring warranty
        </div>
      </div>

      <div class="table-container mat-elevation-z8">
        <table mat-table [dataSource]="dataSource" matSort>
          <ng-container matColumnDef="serialNumber">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Serial Number</th>
            <td mat-cell *matCellDef="let item">{{ item.serialNumber }}</td>
          </ng-container>

          <ng-container matColumnDef="productName">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Product</th>
            <td mat-cell *matCellDef="let item">
              {{ item.product.name }} - {{ item.product.model }}
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
            <td mat-cell *matCellDef="let item">
              <span class="status-badge" [style.background-color]="getStatusColor(item.status)">
                {{ item.status }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="lastMaintenance">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Last Maintenance</th>
            <td mat-cell *matCellDef="let item">
              <span [class.maintenance-due]="isMaintenanceDue(item)">
                {{ item.lastMaintenance?.date | date }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="warranty">
            <th mat-header-cell *matHeaderCellDef>Warranty</th>
            <td mat-cell *matCellDef="let item">
              <span [class.warranty-expiring]="isWarrantyExpiring(item)">
                {{ item.warranty?.endDate | date }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let item">
              <button mat-icon-button [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="updateStatus(item)">
                  <mat-icon>update</mat-icon>
                  <span>Update Status</span>
                </button>
                <button mat-menu-item (click)="recordMaintenance(item)">
                  <mat-icon>build</mat-icon>
                  <span>Record Maintenance</span>
                </button>
                <button mat-menu-item (click)="recordCalibration(item)">
                  <mat-icon>settings</mat-icon>
                  <span>Record Calibration</span>
                </button>
                <button mat-menu-item (click)="viewHistory(item)">
                  <mat-icon>history</mat-icon>
                  <span>View History</span>
                </button>
                <button mat-menu-item (click)="viewDetails(item)">
                  <mat-icon>info</mat-icon>
                  <span>View Details</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]" aria-label="Select page of items"></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .items-container {
      padding: 20px;
    }

    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      align-items: center;
      flex-wrap: wrap;

      mat-form-field {
        min-width: 200px;
      }
    }

    .alerts {
      margin-bottom: 20px;
      display: flex;
      gap: 16px;

      .alert {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: 500;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        &.maintenance {
          background-color: #fff3e0;
          color: #f57c00;
        }

        &.warranty {
          background-color: #fbe9e7;
          color: #d84315;
        }
      }
    }

    .table-container {
      overflow: auto;

      table {
        width: 100%;
      }

      .status-badge {
        padding: 4px 8px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
      }

      .maintenance-due {
        color: #f57c00;
        font-weight: 500;
      }

      .warranty-expiring {
        color: #d84315;
        font-weight: 500;
      }
    }

    .mat-column-actions {
      width: 48px;
      text-align: center;
    }
  `]
})
export class ItemsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['serialNumber', 'productName', 'status', 'lastMaintenance', 'warranty', 'actions'];
  dataSource: MatTableDataSource<Item> = new MatTableDataSource<Item>([]);
  maintenanceDueItems: Item[] = [];
  warrantyExpiringItems: Item[] = [];
  selectedStatus = 'all';
  selectedSort = 'serialNumber';

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private itemsService: ItemsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadItems();
    this.loadMaintenanceDueItems();
    this.loadWarrantyExpiringItems();
  }

  loadItems() {
    this.itemsService.getAllItems().subscribe({
      next: (items: Item[]) => {
        this.dataSource.data = items;
        // Set up filter predicate
        this.dataSource.filterPredicate = (data: Item, filter: string) => {
          const searchStr = (data.serialNumber +
            data.product.name +
            data.product.model +
            data.status).toLowerCase();
          return searchStr.includes(filter.toLowerCase());
        };
        // Set up sorting accessor
        this.dataSource.sortingDataAccessor = (item: Item, property: string) => {
          switch (property) {
            case 'productName':
              return item.product.name;
            case 'lastMaintenance':
              return item.lastMaintenance?.date || '';
            default:
              return (item as any)[property];
          }
        };
      },
      error: (error: Error) => {
        this.showError('Error loading items');
      }
    });
  }

  loadMaintenanceDueItems() {
    this.itemsService.getMaintenanceDueItems().subscribe({
      next: (items: Item[]) => {
        this.maintenanceDueItems = items;
      },
      error: (error: Error) => {
        this.showError('Error loading maintenance due items');
      }
    });
  }

  loadWarrantyExpiringItems() {
    this.itemsService.getWarrantyExpiringItems().subscribe({
      next: (items: Item[]) => {
        this.warrantyExpiringItems = items;
      },
      error: (error: Error) => {
        this.showError('Error loading warranty expiring items');
      }
    });
  }

  getTotalItems(): number {
    return this.dataSource.data.length;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByStatus() {
    if (this.selectedStatus === 'all') {
      this.dataSource.filter = '';
    } else {
      this.dataSource.filter = this.selectedStatus;
    }
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  applySorting() {
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item: Item, property: string) => {
      switch (property) {
        case 'productName':
          return item.product.name;
        case 'lastMaintenance':
          return item.lastMaintenance?.date || '';
        default:
          return (item as any)[property];
      }
    };
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'inventory':
        return '#4caf50';
      case 'demo':
        return '#2196f3';
      case 'delivery':
        return '#ff9800';
      case 'maintenance':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  }

  isMaintenanceDue(item: Item): boolean {
    return this.maintenanceDueItems.some(i => i._id === item._id);
  }

  isWarrantyExpiring(item: Item): boolean {
    return this.warrantyExpiringItems.some(i => i._id === item._id);
  }

  openAddItemDialog() {
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe({
      next: (result) => {
        if (result) {
          this.itemsService.createItem(result).subscribe({
            next: () => {
              this.loadItems();
              this.showSuccess('Item added successfully');
            },
            error: (error: Error) => {
              console.error('Error adding item:', error);
              this.showError('Error adding item');
            }
          });
        }
      }
    });
  }

  updateStatus(item: Item) {
    // For now, just update the status directly
    const newStatus = item.status === 'inventory' ? 'demo' : 'inventory';
    this.itemsService.updateStatus(item._id, newStatus).subscribe({
      next: () => {
        this.loadItems();
        this.showSuccess('Status updated successfully');
      },
      error: () => this.showError('Error updating status')
    });
  }

  recordMaintenance(item: Item) {
    // For now, just record a simple maintenance
    const maintenanceData = {
      type: 'routine',
      notes: 'Routine maintenance check'
    };
    this.itemsService.recordMaintenance(item._id, maintenanceData).subscribe({
      next: () => {
        this.loadItems();
        this.loadMaintenanceDueItems();
        this.showSuccess('Maintenance recorded successfully');
      },
      error: () => this.showError('Error recording maintenance')
    });
  }

  recordCalibration(item: Item) {
    // For now, just record a simple calibration
    const calibrationData = {
      notes: 'Routine calibration check',
      nextDueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
    };
    this.itemsService.recordCalibration(item._id, calibrationData).subscribe({
      next: () => {
        this.loadItems();
        this.showSuccess('Calibration recorded successfully');
      },
      error: () => this.showError('Error recording calibration')
    });
  }

  viewHistory(item: Item) {
    // For now, just show a success message
    this.showSuccess('History view not implemented yet');
  }

  viewDetails(item: Item) {
    // For now, just show a success message
    this.showSuccess('Details view not implemented yet');
  }

  exportInventoryReport() {
    this.itemsService.getInventoryReport().subscribe({
      next: (report: InventoryReport) => {
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error: Error) => this.showError('Error generating report')
    });
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
