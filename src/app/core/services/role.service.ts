import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role, Permission, PermissionType } from '@core/models/role.model';
import { environment } from '@environments/environment';

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

  // Get default role
  getDefaultRole(): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/default`);
  }
}
