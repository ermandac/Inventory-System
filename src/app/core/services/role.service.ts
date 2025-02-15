import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Role, RoleName, Permission, PermissionType, DEFAULT_ROLES } from '@core/models/role.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  getRoleById(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`);
  }

  getRoleByName(name: RoleName): Observable<Role | null> {
    return this.http.get<Role[]>(`${this.apiUrl}?name=${name}`).pipe(
      map(roles => roles.length > 0 ? roles[0] : null),
      catchError(() => of(null))
    );
  }

  createRole(role: Role): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, role);
  }

  updateRole(role: Role): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/${role._id}`, role);
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Check if a role has a specific permission
  hasPermission(role: Role, resource: string, permissionType: PermissionType): boolean {
    return role.permissions.some(
      permission => 
        permission.resource === resource && 
        permission.type === permissionType
    );
  }

  // Initialize default roles if not exist
  initializeDefaultRoles(): Observable<Role[]> {
    return this.getAllRoles().pipe(
      map(existingRoles => {
        const rolesToCreate = DEFAULT_ROLES.filter(
          defaultRole => !existingRoles.some(
            existingRole => existingRole.name === defaultRole.name
          )
        );
        
        return rolesToCreate;
      }),
      map(rolesToCreate => {
        // Create roles that don't exist
        rolesToCreate.forEach(role => {
          this.createRole(role).subscribe();
        });
        
        return rolesToCreate;
      })
    );
  }

  // Get default role (fallback to first role if no default)
  getDefaultRole(): Observable<Role | null> {
    return this.getRoleByName(RoleName.ADMIN).pipe(
      catchError(() => 
        this.getAllRoles().pipe(
          map(roles => roles.length > 0 ? roles[0] : null)
        )
      )
    );
  }
}
