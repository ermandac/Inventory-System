import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  CanActivateChild, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  UrlTree, 
  Router 
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, catchError } from 'rxjs/operators';
import { AuthorizationService } from '@core/services/authorization.service';
import { ResourceType, PermissionType } from '@core/models/role.model';

interface PermissionData {
  resource: ResourceType;
  type: PermissionType;
}

@Injectable({
  providedIn: 'root'
})
export class AuthorizationGuard implements CanActivate, CanActivateChild {
  constructor(
    private authorizationService: AuthorizationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.checkPermission(route);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.checkPermission(route);
  }

  private checkPermission(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const requiredPermission = route.data['permission'] as PermissionData;

    if (!requiredPermission) {
      console.warn('No permission defined for this route');
      return of(this.router.createUrlTree(['/unauthorized']));
    }

    return this.authorizationService.hasPermission(
      requiredPermission.resource, 
      requiredPermission.type
    ).pipe(
      take(1),
      map(hasPermission => {
        if (!hasPermission) {
          return this.router.createUrlTree(['/unauthorized']);
        }
        return true;
      }),
      catchError(() => of(this.router.createUrlTree(['/unauthorized'])))
    );
  }
}
