import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { NavigationService, NavItem } from '@core/services/navigation.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dynamic-navigation',
  standalone: true,
  imports: [
    CommonModule, 
    MatListModule, 
    MatIconModule,
    RouterModule
  ],
  template: `
    <mat-nav-list>
      <mat-list-item 
        *ngFor="let item of navItems$ | async" 
        (click)="navigateTo(item.route)"
        [routerLink]="item.route"
        class="nav-item"
      >
        <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
        <span matListItemTitle>{{ item.label }}</span>
      </mat-list-item>
    </mat-nav-list>
  `,
  styles: [`
    .nav-item {
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    .nav-item:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
  `]
})
export class DynamicNavigationComponent implements OnInit {
  navItems$: Observable<NavItem[]>;

  constructor(private navigationService: NavigationService) {
    this.navItems$ = this.navigationService.getVisibleNavItems();
  }

  ngOnInit(): void {
    console.log('[DynamicNavigationComponent] Initializing navigation');
  }

  navigateTo(route: string): void {
    console.log(`[DynamicNavigationComponent] Navigating to: ${route}`);
    this.navigationService.navigateTo(route);
  }
}
