import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterModule } from '@angular/router';
import { ItemsService, InventoryReport } from '../../core/services/items.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatBadgeModule,
    RouterModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <mat-card class="summary-card">
          <mat-card-header>
            <mat-card-title>Total Items</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="card-content">
              <mat-icon>inventory_2</mat-icon>
              <span class="count">{{ totalItems }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card warning">
          <mat-card-header>
            <mat-card-title>Maintenance Due</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="card-content">
              <mat-icon>build</mat-icon>
              <span class="count">{{ maintenanceDueCount }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card alert">
          <mat-card-header>
            <mat-card-title>Warranty Expiring</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="card-content">
              <mat-icon>warning</mat-icon>
              <span class="count">{{ warrantyExpiringCount }}</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .summary-card {
      .card-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 20px;

        mat-icon {
          font-size: 36px;
          width: 36px;
          height: 36px;
        }

        .count {
          font-size: 32px;
          font-weight: bold;
        }
      }

      &.warning {
        background-color: #fff3e0;
        mat-icon {
          color: #f57c00;
        }
      }

      &.alert {
        background-color: #fbe9e7;
        mat-icon {
          color: #d84315;
        }
      }
    }
  `]
})
export class DashboardHomeComponent implements OnInit {
  totalItems = 0;
  maintenanceDueCount = 0;
  warrantyExpiringCount = 0;

  constructor(private itemsService: ItemsService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.itemsService.getInventoryReport().subscribe({
      next: (data: InventoryReport) => {
        this.totalItems = Object.values(data.totalCounts).reduce((sum, count) => sum + count, 0);
        this.maintenanceDueCount = data.alerts.maintenanceDue;
        this.warrantyExpiringCount = data.alerts.warrantyExpiring;
      },
      error: (error: Error) => {
        console.error('Error loading dashboard data:', error);
      }
    });
  }
}
