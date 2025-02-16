import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { OrderService } from '@core/services/order.service';
import { Order, OrderItem } from '@core/models/order.model';

@Component({
  selector: 'app-edit-order-dialog',
  templateUrl: './edit-order-dialog.component.html',
  styleUrls: ['./edit-order-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule
  ]
})
export class EditOrderDialogComponent implements OnInit {
  orderForm: FormGroup;
  orderStatuses: string[] = [
    'pending', 
    'processing', 
    'ready_for_delivery', 
    'in_delivery', 
    'completed', 
    'cancelled'
  ];

  constructor(
    private dialogRef: MatDialogRef<EditOrderDialogComponent>,
    private fb: FormBuilder,
    private orderService: OrderService,
    @Inject(MAT_DIALOG_DATA) public data: { order: Order }
  ) {
    this.orderForm = this.fb.group({
      status: [data.order.status, Validators.required],
      customer: [{ value: data.order.customer, disabled: true }]
    });
  }

  ngOnInit(): void {}

  updateOrder(): void {
    if (this.orderForm.valid) {
      const updatedOrder: Order = {
        ...this.data.order,
        status: this.orderForm.get('status')?.value
      };

      this.orderService.updateOrderStatus(updatedOrder._id!, updatedOrder.status).subscribe(
        updatedOrderResponse => {
          this.dialogRef.close(updatedOrderResponse);
        },
        error => {
          console.error('Error updating order', error);
          // TODO: Add error handling toast/snackbar
        }
      );
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  calculateTotalValue(): number {
    return this.data.order.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  }
}
