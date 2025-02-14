import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  CanActivateChild, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  UrlTree, 
  Router 
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthorizationService } from '@core/services/authorization.service';
import { PermissionType } from '@core/models/role.model';

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
    const requiredPermission = route.data['permission'] as {
      resource: string;
      type: PermissionType;
    };

    if (!requiredPermission) {
      console.warn('No permission defined for this route');
      return this.authorizationService.hasPermission(
        requiredPermission.resource, 
        requiredPermission.type
      ).pipe(
        take(1),
        map(hasPermission => {
          if (!hasPermission) {
            // Redirect to unauthorized page or dashboard
            return this.router.createUrlTree(['/unauthorized']);
          }
          return true;
        })
      );
    }

    // If no specific permission is required, allow access
    return this.authorizationService.hasPermission(
      requiredPermission.resource, 
      requiredPermission.type
    ).pipe(
      take(1),
      map(hasPermission => {
        if (!hasPermission) {
          // Redirect to unauthorized page or dashboard
          return this.router.createUrlTree(['/unauthorized']);
        }
        return true;
      })
    );
  }
}
