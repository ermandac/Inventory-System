import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

// RxJS Imports
import { Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { 
  takeUntil, 
  map, 
  startWith, 
  switchMap, 
  catchError, 
  finalize 
} from 'rxjs/operators';

// Material Imports
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

// Core Imports
import { Order } from '@core/models/order.model';
import { OrderService } from '@core/services/order.service';
import { AuthService, User } from '@core/services/auth.service';
import { AuthorizationService } from '@core/services/authorization.service';

// Dialog Components
import { CreateOrderDialogComponent } from './dialogs/create-order/create-order-dialog.component';
import { UpdateOrderStatusDialogComponent } from './dialogs/update-order-status/update-order-status-dialog.component';
import { EditOrderDialogComponent } from './dialogs/edit-order/edit-order-dialog.component';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, OnDestroy {
  // Table Configuration
  displayedColumns: string[] = [
    'orderNumber', 
    'status', 
    'orderDate', 
    'totalValue', 
    'actions'
  ];

  // Data Sources
  dataSource = new MatTableDataSource<Order>([]);
  
  // State Management
  private destroy$ = new Subject<void>();
  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();
  
  // For template access
  get loading(): boolean {
    return this.loadingSubject.getValue();
  }

  // Filter Control
  filterControl = new FormControl<string>('');

  // View Children
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Observables
  currentUser$: Observable<User | null>;
  orders$: Observable<Order[]>;

  // Permissions
  canCreateOrder = false;
  canUpdateOrderStatus = false;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private authorizationService: AuthorizationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize current user observable
    this.currentUser$ = this.authService.getCurrentUser();

    // Initialize orders observable with filtering
    this.orders$ = combineLatest([
      this.currentUser$,
      this.filterControl.valueChanges.pipe(startWith(''))
    ]).pipe(
      switchMap(([user, filterValue]) => 
        this.orderService.getOrders().pipe(
          map(orders => this.filterOrders(orders, filterValue || '')),
          catchError(error => {
            this.handleError('Failed to load orders', error);
            return [];
          })
        )
      ),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit(): void {
    // Set up permissions
    this.updatePermissions();

    // Subscribe to orders and update data source
    this.orders$.subscribe({
      next: (orders) => {
        this.dataSource.data = orders;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loadingSubject.next(false);
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updatePermissions(): void {
    const currentRole = this.authorizationService.getCurrentUserRole();
    this.canCreateOrder = this.authorizationService.canCreateOrders();
    this.canUpdateOrderStatus = this.authorizationService.canUpdateOrderStatus();
  }

  private filterOrders(orders: Order[], filterValue: string): Order[] {
    if (!filterValue) return orders;
    
    const lowercaseFilter = filterValue.toLowerCase();
    return orders.filter(order => 
      order.orderNumber?.toLowerCase().includes(lowercaseFilter) ||
      order.status?.toLowerCase().includes(lowercaseFilter)
    );
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.snackBar.open(`${message}: ${error.message || 'Unknown error'}`, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterControl.setValue(filterValue);
  }

  openCreateOrderDialog(): void {
    if (!this.canCreateOrder) {
      this.snackBar.open('You do not have permission to create orders', 'Close', { 
        duration: 3000 
      });
      return;
    }

    const dialogRef = this.dialog.open(CreateOrderDialogComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Trigger order refresh
        this.loadingSubject.next(true);
      }
    });
  }

  viewOrderDetails(order: Order): void {
    // Use EditOrderDialog since there's no specific OrderDetailsDialog
    this.dialog.open(EditOrderDialogComponent, {
      width: '800px',
      data: { order }
    });
  }

  updateOrderStatus(order: Order): void {
    if (!this.canUpdateOrderStatus) {
      this.snackBar.open('You do not have permission to update order status', 'Close', { 
        duration: 3000 
      });
      return;
    }

    this.dialog.open(UpdateOrderStatusDialogComponent, {
      width: '400px',
      data: { order }
    });
  }
}
