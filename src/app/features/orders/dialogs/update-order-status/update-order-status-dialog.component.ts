import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Order } from '@core/models/order.model';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

export const ORDER_STATUSES = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled'
];

@Component({
  selector: 'app-update-order-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule
  ],
  template: `
    <h2 mat-dialog-title>Update Order Status</h2>
    <mat-dialog-content>
      <mat-form-field>
        <mat-label>New Status</mat-label>
        <mat-select [(value)]="selectedStatus">
          <mat-option *ngFor="let status of orderStatuses" [value]="status">
            {{ status }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-button (click)="onConfirm()" [disabled]="!selectedStatus">Confirm</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field {
      width: 100%;
    }
  `]
})
export class UpdateOrderStatusDialogComponent {
  orderStatuses = ORDER_STATUSES;
  selectedStatus: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<UpdateOrderStatusDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { order: Order }
  ) {
    // Pre-select current status if available
    this.selectedStatus = data.order.status || null;
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    if (this.selectedStatus) {
      this.dialogRef.close(this.selectedStatus);
    }
  }
}
