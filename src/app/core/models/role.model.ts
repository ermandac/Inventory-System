export enum PermissionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete'
}

export interface Permission {
  resource: string;
  type: PermissionType;
}

export interface Role {
  _id?: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
