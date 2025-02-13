import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <div class="dashboard-container">
      <h1>Welcome to Inventory System</h1>
      <div class="dashboard-stats">
        <mat-card class="stat-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>inventory_2</mat-icon>
            <mat-card-title>Total Products</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <h2>150</h2>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>category</mat-icon>
            <mat-card-title>Items in Stock</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <h2>1,234</h2>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>shopping_cart</mat-icon>
            <mat-card-title>Pending Orders</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <h2>25</h2>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>local_shipping</mat-icon>
            <mat-card-title>Active Shipments</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <h2>42</h2>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;

      h1 {
        margin-bottom: 24px;
        color: #333;
      }
    }

    .dashboard-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
    }

    .stat-card {
      mat-card-header {
        margin-bottom: 16px;

        mat-icon {
          color: #3f51b5;
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      mat-card-content {
        text-align: center;

        h2 {
          font-size: 2.5rem;
          margin: 0;
          color: #3f51b5;
        }
      }
    }
  `]
})
export class DashboardHomeComponent {}
