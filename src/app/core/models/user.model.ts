export interface User {
  _id?: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleId: string;
  isActive?: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
