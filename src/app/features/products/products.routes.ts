import { Routes } from '@angular/router';
import { ProductsComponent } from './products.component';
import { authGuard } from '../../core/guards/auth.guard';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    component: ProductsComponent,
    canActivate: [authGuard],
    title: 'Product Catalog'
  }
];
