import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';

import { Order } from '@core/models/order.model';
import { OrderService } from '@core/services/order.service';
import { AuthorizationService } from '@core/services/authorization.service';

// Dialog Components
import { CreateOrderDialogComponent } from './dialogs/create-order/create-order-dialog.component';
import { EditOrderDialogComponent } from './dialogs/edit-order/edit-order-dialog.component';
import { UpdateOrderStatusDialogComponent } from './dialogs/update-order-status/update-order-status-dialog.component';

import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';

import { ResourceType, PermissionType } from '@core/models/role.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatPaginatorModule, 
    MatInputModule, 
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatSortModule,
    CreateOrderDialogComponent,
    EditOrderDialogComponent,
    UpdateOrderStatusDialogComponent
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['orderNumber', 'customer', 'status', 'orderDate', 'totalValue', 'actions'];
  dataSource: MatTableDataSource<Order> = new MatTableDataSource<Order>([]);
  loading = true;
  canCreateOrder = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Statuses for filtering
  statusOptions: Order['status'][] = [
    'pending', 
    'processing', 
    'ready_for_delivery', 
    'in_delivery', 
    'completed', 
    'cancelled'
  ];

  constructor(
    private orderService: OrderService,
    private dialog: MatDialog,
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit(): void {
    this.checkPermissions();
    this.loadOrders();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  checkPermissions(): void {
    // Check create permission
    this.authorizationService.hasPermission(
      ResourceType.PURCHASE_ORDERS, 
      PermissionType.CREATE
    ).subscribe(canCreate => this.canCreateOrder = canCreate);
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.dataSource.data = orders;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders', error);
        this.loading = false;
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

  openCreateOrderDialog(): void {
    const dialogRef = this.dialog.open(CreateOrderDialogComponent, {
      width: '90%',
      height: '90%'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOrders();
      }
    });
  }

  updateOrderStatus(order: Order): void {
    const dialogRef = this.dialog.open(UpdateOrderStatusDialogComponent, {
      width: '400px',
      data: { order }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOrders();
      }
    });
  }

  viewOrderDetails(orderId: string): void {
    const dialogRef = this.dialog.open(EditOrderDialogComponent, {
      width: '600px',
      data: { orderId }
    });
  }

  getOrderStatusLabel(status: Order['status']): string {
    const statusLabels: Record<Order['status'], string> = {
      'pending': 'Pending',
      'processing': 'Processing',
      'ready_for_delivery': 'Ready for Delivery',
      'in_delivery': 'In Delivery',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusLabels[status] || status;
  }

  async canUpdateStatus(order: Order): Promise<boolean> {
    return this.authorizationService.hasPermission(
      ResourceType.PURCHASE_ORDERS, 
      PermissionType.UPDATE
    ).toPromise() || false;
  }
}
