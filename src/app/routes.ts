import { Routes } from '@angular/router';
import { DashboardComponent } from './layout/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes')
          .then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'products',
        loadChildren: () => import('./features/products/products.routes')
          .then(m => m.PRODUCTS_ROUTES)
      },
      {
        path: 'items',
        loadChildren: () => import('./features/items/items.routes')
          .then(m => m.ITEMS_ROUTES)
      },
      {
        path: 'orders',
        loadChildren: () => import('./features/orders/orders.routes')
          .then(m => m.ORDERS_ROUTES)
      },
      {
        path: 'shipments',
        loadChildren: () => import('./features/shipments/shipments.routes')
          .then(m => m.SHIPMENTS_ROUTES)
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes')
          .then(m => m.USERS_ROUTES)
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.routes')
          .then(m => m.REPORTS_ROUTES)
      }
    ]
  }
];
