import { Routes } from '@angular/router';
import { AuthorizationGuard } from '@core/guards/authorization.guard';
import { ResourceType, PermissionType } from '@core/models/role.model';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./users.component')
      .then(m => m.UsersComponent),
    canActivate: [AuthorizationGuard],
    data: {
      permission: {
        resource: ResourceType.USERS,
        type: PermissionType.LIST
      }
    }
  }
];
