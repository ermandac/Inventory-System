import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, map, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { RoleName } from '@core/models/role.model';
import { AuthorizationService } from './authorization.service';
import { Role } from '@core/models/role.model';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  allowedRoles: RoleName[];
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private visibleNavItems = new BehaviorSubject<NavItem[]>([]);
  visibleNavItems$ = this.visibleNavItems.asObservable();

  private navigationItems: NavItem[] = [
    // Admin Role - Full System Access
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      allowedRoles: [RoleName.ADMIN, RoleName.INVENTORY_STAFF, RoleName.LOGISTICS_MANAGER, RoleName.CUSTOMER]
    },
    // Admin-only items
    {
      label: 'Users',
      icon: 'people',
      route: '/users',
      allowedRoles: [RoleName.ADMIN]
    },
    {
      label: 'Roles',
      icon: 'security',
      route: '/roles',
      allowedRoles: [RoleName.ADMIN]
    },
    // Products
    {
      label: 'Products',
      icon: 'inventory_2',
      route: '/products',
      allowedRoles: [RoleName.ADMIN, RoleName.INVENTORY_STAFF, RoleName.CUSTOMER]
    },
    // Inventory
    {
      label: 'Inventory',
      icon: 'inventory',
      route: '/items',
      allowedRoles: [RoleName.ADMIN, RoleName.INVENTORY_STAFF]
    },
    // Purchase Orders
    {
      label: 'Purchase Orders',
      icon: 'shopping_cart',
      route: '/orders',
      allowedRoles: [RoleName.ADMIN, RoleName.INVENTORY_STAFF, RoleName.LOGISTICS_MANAGER, RoleName.CUSTOMER]
    },
    // Shipments
    {
      label: 'Shipments',
      icon: 'local_shipping',
      route: '/shipments',
      allowedRoles: [RoleName.ADMIN, RoleName.LOGISTICS_MANAGER]
    },
    // Reports
    {
      label: 'Reports',
      icon: 'assessment',
      route: '/reports',
      allowedRoles: [RoleName.ADMIN, RoleName.INVENTORY_STAFF, RoleName.LOGISTICS_MANAGER]
    }
  ];

  constructor(
    private authorizationService: AuthorizationService,
    private router: Router
  ) {
    // Initial setup
    this.setupRoleSubscription();
  }

  // Setup role subscription with ability to reset
  private setupRoleSubscription(): void {
    this.authorizationService.currentUserRole$.subscribe(role => {
      console.log('[NavigationService] Role changed:', role);
      
      if (role) {
        // Normalize role name for comparison
        const normalizedRoleName = this.normalizeRoleName(role.name);
        console.log(`[NavigationService] Normalized role name: ${normalizedRoleName}`);
        
        const filteredItems = this.navigationItems.filter(item => 
          item.allowedRoles.some(allowedRole => 
            this.normalizeRoleName(allowedRole) === normalizedRoleName
          )
        );

        console.log('[NavigationService] Filtered nav items:', 
          JSON.stringify(filteredItems, null, 2)
        );
        
        this.visibleNavItems.next(filteredItems);
      } else {
        console.log('[NavigationService] No role, clearing navigation items');
        this.visibleNavItems.next([]);
      }
    });
  }

  // Helper method to normalize role names for comparison
  private normalizeRoleName(roleName: string): string {
    return roleName.toLowerCase().replace(/\s+/g, '_');
  }

  // Method to force refresh navigation items
  refreshNavigationItems(): void {
    console.log('[NavigationService] Forcing navigation items refresh');
    const currentRole = this.authorizationService.getCurrentUserRole();
    
    if (currentRole) {
      const filteredItems = this.getNavigationItems();
      this.visibleNavItems.next(filteredItems);
    } else {
      this.visibleNavItems.next([]);
    }
  }

  // New method to handle navigation
  navigateTo(route: string): void {
    console.log(`[NavigationService] Navigating to: ${route}`);
    
    // Check if the route is allowed for the current role
    const currentRole = this.authorizationService.getCurrentUserRole();
    if (!currentRole) {
      console.error('[NavigationService] No current role, cannot navigate');
      return;
    }

    const navItem = this.navigationItems.find(item => item.route === route);
    if (!navItem) {
      console.error(`[NavigationService] Route not found: ${route}`);
      return;
    }

    // Check if the route is allowed for the current role
    if (!navItem.allowedRoles.includes(currentRole.name)) {
      console.error(`[NavigationService] Route not allowed for current role: ${route}`);
      this.router.navigate(['/unauthorized'], {
        queryParams: {
          reason: 'insufficient_permissions',
          route: route
        }
      });
      return;
    }

    // Perform navigation
    this.router.navigate([route]);
  }

  // Method to get visible navigation items based on current role
  getVisibleNavItems(): Observable<NavItem[]> {
    return this.authorizationService.currentUserRole$.pipe(
      map(role => {
        if (!role) {
          console.log('[NavigationService] No role, returning empty nav items');
          return [];
        }

        // Normalize role name for comparison
        const normalizedRoleName = this.normalizeRoleName(role.name);
        console.log(`[NavigationService] Filtering nav items for role: ${normalizedRoleName}`);
        
        const filteredItems = this.navigationItems.filter(item => 
          item.allowedRoles.some(allowedRole => 
            this.normalizeRoleName(allowedRole) === normalizedRoleName
          )
        );

        console.log('[NavigationService] Filtered nav items:', 
          JSON.stringify(filteredItems, null, 2)
        );

        return filteredItems;
      }),
      catchError(error => {
        console.error('[NavigationService] Error getting visible nav items:', error);
        return of([]);
      })
    );
  }

  clearNavigationItems(): void {
    console.log('[NavigationService] Clearing navigation items');
    this.visibleNavItems.next([]);
  }

  private getNavigationItems(): NavItem[] {
    const currentRole = this.authorizationService.getCurrentUserRole();
    
    if (!currentRole) {
      console.log('[NavigationService] No current role, returning empty nav items');
      return [];
    }

    console.log(`[NavigationService] Getting nav items for role: ${currentRole.name}`);
    
    const filteredItems = this.navigationItems.filter(item => 
      item.allowedRoles.includes(currentRole.name)
    );

    console.log('[NavigationService] Filtered nav items:', 
      JSON.stringify(filteredItems, null, 2)
    );

    return filteredItems;
  }
}
