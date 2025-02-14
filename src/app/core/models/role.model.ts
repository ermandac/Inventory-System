export enum RoleName {
  ADMIN = 'Admin',
  CUSTOMER = 'Customer',
  INVENTORY_STAFF = 'Inventory Staff',
  LOGISTICS_MANAGER = 'Logistics Manager'
}

export enum ResourceType {
  PRODUCTS = 'products',
  PURCHASE_ORDERS = 'purchase_orders',
  INVENTORY_ITEMS = 'inventory_items',
  SHIPMENTS = 'shipments',
  USERS = 'users',
  ROLES = 'roles'
}

export enum PermissionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list'
}

export interface Permission {
  resource: ResourceType;
  type: PermissionType;
}

export interface Role {
  _id?: string;
  name: RoleName;
  description?: string;
  permissions: Permission[];
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Predefined role configurations
export const DEFAULT_ROLES: Role[] = [
  {
    name: RoleName.ADMIN,
    description: 'Full system access with all permissions',
    permissions: Object.values(ResourceType).flatMap(resource => 
      Object.values(PermissionType).map(type => ({ resource, type }))
    ),
    isDefault: false
  },
  {
    name: RoleName.CUSTOMER,
    description: 'Can create and review purchase orders',
    permissions: [
      { resource: ResourceType.PURCHASE_ORDERS, type: PermissionType.CREATE },
      { resource: ResourceType.PURCHASE_ORDERS, type: PermissionType.READ },
      { resource: ResourceType.PURCHASE_ORDERS, type: PermissionType.LIST }
    ],
    isDefault: false
  },
  {
    name: RoleName.INVENTORY_STAFF,
    description: 'Manage and update inventory items and products',
    permissions: [
      { resource: ResourceType.PRODUCTS, type: PermissionType.CREATE },
      { resource: ResourceType.PRODUCTS, type: PermissionType.READ },
      { resource: ResourceType.PRODUCTS, type: PermissionType.UPDATE },
      { resource: ResourceType.PRODUCTS, type: PermissionType.LIST },
      { resource: ResourceType.INVENTORY_ITEMS, type: PermissionType.CREATE },
      { resource: ResourceType.INVENTORY_ITEMS, type: PermissionType.READ },
      { resource: ResourceType.INVENTORY_ITEMS, type: PermissionType.UPDATE },
      { resource: ResourceType.INVENTORY_ITEMS, type: PermissionType.LIST }
    ],
    isDefault: false
  },
  {
    name: RoleName.LOGISTICS_MANAGER,
    description: 'Track and coordinate shipments and deliveries',
    permissions: [
      { resource: ResourceType.SHIPMENTS, type: PermissionType.CREATE },
      { resource: ResourceType.SHIPMENTS, type: PermissionType.READ },
      { resource: ResourceType.SHIPMENTS, type: PermissionType.UPDATE },
      { resource: ResourceType.SHIPMENTS, type: PermissionType.LIST }
    ],
    isDefault: false
  }
];
