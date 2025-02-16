import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { Order } from '@core/models/order.model';
import { OrderService } from '@core/services/order.service';
import { AuthorizationService } from '@core/services/authorization.service';

import { CreateOrderDialogComponent } from './dialogs/create-order/create-order-dialog.component';
import { EditOrderDialogComponent } from './dialogs/edit-order/edit-order-dialog.component';
import { UpdateOrderStatusDialogComponent } from './dialogs/update-order-status/update-order-status-dialog.component';

import { ResourceType, PermissionType, Permission } from '@core/models/role.model';

import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

import { BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';

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
    CreateOrderDialogComponent,
    EditOrderDialogComponent,
    UpdateOrderStatusDialogComponent
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  displayedColumns: string[] = ['orderNumber', 'customer', 'status', 'orderDate', 'totalValue', 'actions'];
  dataSource: MatTableDataSource<Order> = new MatTableDataSource<Order>([]);
  loading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Statuses for filtering
  statusOptions: Order['status'][] = [
    'pending', 
    'processing', 
    'ready_for_delivery', 
    'in_delivery', 
    'completed', 
    'cancelled'
  ];

  // Permissions
  canCreateOrder = false;
  canEditOrder = false;
  canDeleteOrder = false;

  constructor(
    private orderService: OrderService,
    private authorizationService: AuthorizationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Check permissions
    this.checkPermissions();
    this.loadOrders();
  }

  checkPermissions(): void {
    // Check create permission
    this.authorizationService.hasPermission(
      ResourceType.PURCHASE_ORDERS, 
      PermissionType.CREATE
    ).subscribe(canCreate => {
      this.canCreateOrder = canCreate;
    });

    // Check edit permission
    this.authorizationService.hasPermission(
      ResourceType.PURCHASE_ORDERS, 
      PermissionType.UPDATE
    ).subscribe(canEdit => {
      this.canEditOrder = canEdit;
    });

    // Check delete permission
    this.authorizationService.hasPermission(
      ResourceType.PURCHASE_ORDERS, 
      PermissionType.DELETE
    ).subscribe(canDelete => {
      this.canDeleteOrder = canDelete;
    });
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe(orders => {
      this.dataSource.data = orders;
      this.dataSource.paginator = this.paginator;
      this.loading = false;
    }, error => {
      console.error('Error fetching orders:', error);
      this.loading = false;
    });
  }

  openCreateOrderDialog(): void {
    const dialogRef = this.dialog.open(CreateOrderDialogComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOrders();
      }
    });
  }

  editOrder(order: Order): void {
    const dialogRef = this.dialog.open(EditOrderDialogComponent, {
      width: '600px',
      data: { order }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOrders();
      }
    });
  }

  deleteOrder(order: Order): void {
    if (confirm(`Are you sure you want to delete order ${order.orderNumber}?`)) {
      if (order._id) {
        this.orderService.deleteOrder(order._id!).subscribe({
          next: () => this.loadOrders(),
          error: (err) => console.error('Error deleting order', err)
        });
      }
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getOrderStatusLabel(status: Order['status']): string {
    // Convert status to a more readable format
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  viewOrderDetails(orderId: string | undefined): void {
    if (orderId) {
      this.orderService.getOrderById(orderId).subscribe({
        next: (order) => {
          // TODO: Implement order details dialog or navigation
          console.log('Order Details:', order);
        },
        error: (err) => {
          console.error('Error fetching order details', err);
        }
      });
    }
  }

  canUpdateStatus(order: Order): Observable<boolean> {
    return this.authorizationService.hasPermission(
      ResourceType.PURCHASE_ORDERS, 
      PermissionType.UPDATE
    );
  }

  updateOrderStatus(order: Order): void {
    // Check if user has permission to update order status
    this.canUpdateStatus(order).subscribe(canUpdate => {
      if (canUpdate) {
        // Open a dialog to select new status
        const dialogRef = this.dialog.open(UpdateOrderStatusDialogComponent, {
          width: '250px',
          data: { order: order }
        });

        dialogRef.afterClosed().subscribe(newStatus => {
          if (newStatus) {
            // Call order service to update status
            this.orderService.updateOrderStatus(order._id, newStatus)
              .pipe(
                catchError(error => {
                  console.error('Error updating order status', error);
                  // TODO: Add user-friendly error handling
                  return [];
                })
              )
              .subscribe(() => {
                // Refresh order list or update specific order
                this.loadOrders();
              });
          }
        });
      } else {
        // TODO: Show permission denied message
        console.warn('User does not have permission to update order status');
      }
    });
  }
}
