import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
import { MatTooltipModule } from '@angular/material/tooltip';

import { ResourceType, PermissionType, RoleName, Role } from '@core/models/role.model';
import { timeout, catchError, take, switchMap, tap, shareReplay, map } from 'rxjs/operators';
import { of, Observable, Subject, combineLatest } from 'rxjs';

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
    MatProgressSpinnerModule,
    MatTooltipModule,
    CreateOrderDialogComponent,
    EditOrderDialogComponent,
    UpdateOrderStatusDialogComponent
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['orderNumber', 'customer', 'status', 'orderDate', 'totalValue', 'actions'];
  dataSource: MatTableDataSource<Order> = new MatTableDataSource<Order>([]);
  loading = true;
  
  // Permissions cache
  private permissionsSubject = new Subject<{
    canViewOrders: boolean,
    canCreateOrders: boolean,
    canUpdateOrderStatus: boolean
  }>();
  permissions$ = this.permissionsSubject.asObservable().pipe(
    shareReplay(1)
  );

  // Expose permissions for template
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
    console.log('[OrdersComponent] Initializing component');
    
    // Log current user role
    const currentRole = this.authorizationService.getCurrentUserRole();
    console.log('[OrdersComponent] Current User Role:', currentRole ? 
      `${currentRole.name} (${currentRole.description})` : 'No role');
    
    // Log role permissions if available
    if (currentRole) {
      console.log('[OrdersComponent] Role Permissions:', 
        currentRole.permissions.map(p => `${p.resource}: ${p.type}`));
    }
    
    this.initializePermissions();
    this.subscribeToPermissions();
    
    console.log('[OrdersComponent] Initialization complete');
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.permissionsSubject.complete();
  }

  private initializePermissions(): void {
    const currentRole = this.authorizationService.getCurrentUserRole();
    
    console.log('[OrdersComponent] Initializing Permissions');
    console.log('[OrdersComponent] Current Role:', currentRole ? 
      `${currentRole.name} (${currentRole.description})` : 'No role detected');
    
    if (!currentRole) {
      console.warn('[OrdersComponent] No current role found');
      this.permissionsSubject.next({
        canViewOrders: false,
        canCreateOrders: false,
        canUpdateOrderStatus: false
      });
      return;
    }

    // For admin, grant full permissions
    if (currentRole.name === RoleName.ADMIN) {
      console.log('[OrdersComponent] Admin role detected, granting full permissions');
      this.permissionsSubject.next({
        canViewOrders: true,
        canCreateOrders: true,
        canUpdateOrderStatus: true
      });
      return;
    }

    // Check specific permissions for non-admin roles
    console.log('[OrdersComponent] Checking specific permissions');
    
    combineLatest([
      this.authorizationService.hasPermission(ResourceType.PURCHASE_ORDERS, PermissionType.READ),
      this.authorizationService.hasPermission(ResourceType.PURCHASE_ORDERS, PermissionType.CREATE),
      this.authorizationService.hasPermission(ResourceType.PURCHASE_ORDERS, PermissionType.UPDATE)
    ]).pipe(
      take(1),
      timeout(5000),
      tap(([canViewOrders, canCreateOrders, canUpdateOrderStatus]) => {
        console.log('[OrdersComponent] Permission Check Results:', {
          canViewOrders,
          canCreateOrders,
          canUpdateOrderStatus
        });
      }),
      catchError(error => {
        console.error('[OrdersComponent] Error checking permissions:', error);
        
        // Log more details about the error
        if (error instanceof Error) {
          console.error(`[OrdersComponent] Error Name: ${error.name}`);
          console.error(`[OrdersComponent] Error Message: ${error.message}`);
        }
        
        return of([false, false, false]);
      })
    ).subscribe(([canViewOrders, canCreateOrders, canUpdateOrderStatus]) => {
      console.log('[OrdersComponent] Emitting Permissions:', {
        canViewOrders,
        canCreateOrders,
        canUpdateOrderStatus
      });
      
      this.permissionsSubject.next({
        canViewOrders,
        canCreateOrders,
        canUpdateOrderStatus
      });
    });
  }

  private subscribeToPermissions(): void {
    this.permissions$.subscribe({
      next: (permissions) => {
        console.log('[OrdersComponent] Current Permissions:', permissions);

        // Update local property for template
        this.canCreateOrder = permissions.canCreateOrders;

        if (permissions.canViewOrders) {
          console.log('[OrdersComponent] Attempting to load orders');
          this.loadOrders();
        } else {
          console.warn('[OrdersComponent] User does not have permission to view orders');
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('[OrdersComponent] Error in permissions subscription:', error);
        this.loading = false;
      }
    });
  }

  // Method for template to check order status update permission
  canUpdateStatus(order: Order): Observable<boolean> {
    return this.permissions$.pipe(
      map(permissions => permissions.canUpdateOrderStatus)
    );
  }

  loadOrders(): void {
    console.log('[OrdersComponent] Loading orders');
    this.loading = true;
    
    this.orderService.getOrders().pipe(
      timeout(10000),
      tap(orders => {
        console.log(`[OrdersComponent] Raw orders received:`, orders);
        console.log(`[OrdersComponent] Number of orders: ${orders.length}`);
      }),
      catchError(error => {
        console.error('[OrdersComponent] Error loading orders:', error);
        
        // More detailed error logging
        if (error.status) {
          console.error(`[OrdersComponent] HTTP Status: ${error.status}`);
        }
        if (error.message) {
          console.error(`[OrdersComponent] Error Message: ${error.message}`);
        }
        
        this.loading = false;
        
        // Optionally show an error message to the user
        // this.snackBar.open('Failed to load orders', 'Retry', { duration: 3000 })
        //   .onAction().subscribe(() => this.loadOrders());
        
        return of([]);
      })
    ).subscribe({
      next: (orders) => {
        console.log(`[OrdersComponent] Loaded ${orders.length} orders`);
        
        // Ensure orders are not null or undefined
        this.dataSource.data = orders || [];
        
        // Always set loading to false
        this.loading = false;
        
        // Log if no orders were found
        if (orders.length === 0) {
          console.warn('[OrdersComponent] No orders found');
        }
      },
      error: (error) => {
        console.error('[OrdersComponent] Unexpected error in order loading:', error);
        this.loading = false;
      },
      complete: () => {
        console.log('[OrdersComponent] Order loading completed');
      }
    });
  }

  async openCreateOrderDialog(): Promise<void> {
    const permissions = await this.permissions$.pipe(take(1)).toPromise();
    
    if (!permissions.canCreateOrders) {
      console.warn('[OrdersComponent] User does not have permission to create orders');
      return;
    }

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

  async updateOrderStatus(order: Order): Promise<void> {
    const permissions = await this.permissions$.pipe(take(1)).toPromise();
    
    if (!permissions.canUpdateOrderStatus) {
      console.warn('[OrdersComponent] User does not have permission to update order status');
      return;
    }

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

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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
}
