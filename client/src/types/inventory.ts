// TypeScript interfaces for inventory system
export interface Part {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  categoryId: number | null;
  supplierId: number | null;
  supplierPartNumber: string | null;
  manufacturer: string | null;
  manufacturerPartNumber: string | null;
  unitCost: string;
  sellingPrice: string;
  markup: string;
  quantityOnHand: number;
  quantityAllocated: number;
  quantityOnOrder: number;
  reorderPoint: number;
  reorderQuantity: number;
  maxStockLevel: number | null;
  location: string | null;
  weight: string | null;
  dimensions: string | null;
  warrantyPeriod: number | null;
  isActive: boolean;
  isStocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  accountNumber: string | null;
  paymentTerms: string;
  taxId: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface StockMovement {
  id: number;
  partId: number;
  movementType: string;
  quantity: number;
  reason: string;
  referenceId: number | null;
  referenceType: string | null;
  notes: string | null;
  performedBy: string;
  createdAt: string;
}

export interface LowStockPart extends Part {
  currentQuantity: number;
  reorderPoint: number;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierId: number;
  status: string;
  orderDate: string;
  expectedDate: string | null;
  receivedDate: string | null;
  subtotal: string;
  taxAmount: string;
  shippingCost: string;
  totalAmount: string;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}