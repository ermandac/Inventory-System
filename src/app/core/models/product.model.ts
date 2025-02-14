export interface Product {
  _id?: string;
  name: string;
  model: string;
  manufacturer: string;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
}
