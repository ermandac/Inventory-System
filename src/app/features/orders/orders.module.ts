import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// Angular Material Imports
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';

// Component Imports
import { OrdersComponent } from './orders.component';
import { CreateOrderDialogComponent } from './dialogs/create-order/create-order-dialog.component';
import { EditOrderDialogComponent } from './dialogs/edit-order/edit-order-dialog.component';
import { UpdateOrderStatusDialogComponent } from './dialogs/update-order-status/update-order-status-dialog.component';

@NgModule({
  declarations: [
    OrdersComponent,
    CreateOrderDialogComponent,
    EditOrderDialogComponent,
    UpdateOrderStatusDialogComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule
  ],
  exports: [
    OrdersComponent
  ]
})
export class OrdersModule { }
