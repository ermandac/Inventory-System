export interface Product {
  _id?: string;
  sku: string;  // Added required SKU field
  name: string;
  model: string;
  manufacturer: string;
  category: string;
  unitPrice: number;

  // Stock-related properties
  availableStock?: number;
  availableItems?: number;
  reservedItems?: number;
  deliveryItems?: number;
  demoItems?: number;
  returnedItems?: number;
  soldItems?: number;
  totalItems?: number;

  description?: string;
  specifications?: string[];
  certifications?: string[];
  technicalDetails?: Record<string, any>;
  maintenanceSchedule?: string;
  warranty?: string;
  documentation?: string;
  support?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
