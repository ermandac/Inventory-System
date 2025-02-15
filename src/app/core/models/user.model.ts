import { RoleName } from './role.model';

export interface User {
  _id?: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'customer' | 'inventory_staff' | 'logistics_manager';
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  organization?: string;
  isActive?: boolean;
  lastLogin?: Date;
  tokens?: { token: string }[];
  createdAt?: Date;
  updatedAt?: Date;
}
