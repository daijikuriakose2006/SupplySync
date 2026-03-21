// Mock data for the application

export interface Product {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  buyingPrice: number;
  stockQuantity: number;
  barcode: string;
  expiryDate: string | null;
  supplierId: string;
  supplierName: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  address: string;
  ordersPlaced: number;
  deliveryStatus: "delivered" | "in-transit" | "pending";
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  date: string;
  revenue: number;
}

export interface Alert {
  id: string;
  type: "low-stock" | "expiry";
  message: string;
  productName: string;
  severity: "high" | "medium" | "low";
  date: string;
}

export const mockProducts: Product[] = [
  { id: "1", name: "Organic Milk 1L", category: "Dairy", sellingPrice: 4.99, buyingPrice: 3.20, stockQuantity: 12, barcode: "8901234567890", expiryDate: "2026-04-01", supplierId: "1", supplierName: "FreshFarms Co." },
  { id: "2", name: "Whole Wheat Bread", category: "Bakery", sellingPrice: 3.49, buyingPrice: 1.80, stockQuantity: 45, barcode: "8901234567891", expiryDate: "2026-03-25", supplierId: "2", supplierName: "BakeHouse Ltd." },
  { id: "3", name: "Free Range Eggs (12pk)", category: "Dairy", sellingPrice: 6.99, buyingPrice: 4.50, stockQuantity: 8, barcode: "8901234567892", expiryDate: "2026-04-10", supplierId: "1", supplierName: "FreshFarms Co." },
  { id: "4", name: "Basmati Rice 5kg", category: "Grains", sellingPrice: 12.99, buyingPrice: 8.00, stockQuantity: 60, barcode: "8901234567893", expiryDate: null, supplierId: "3", supplierName: "GrainMaster Inc." },
  { id: "5", name: "Olive Oil 500ml", category: "Oils", sellingPrice: 8.49, buyingPrice: 5.60, stockQuantity: 3, barcode: "8901234567894", expiryDate: "2027-01-15", supplierId: "4", supplierName: "Mediterranean Foods" },
  { id: "6", name: "Cheddar Cheese 200g", category: "Dairy", sellingPrice: 5.29, buyingPrice: 3.40, stockQuantity: 22, barcode: "8901234567895", expiryDate: "2026-05-20", supplierId: "1", supplierName: "FreshFarms Co." },
  { id: "7", name: "Tomato Sauce 400g", category: "Canned", sellingPrice: 2.99, buyingPrice: 1.50, stockQuantity: 78, barcode: "8901234567896", expiryDate: "2027-06-01", supplierId: "4", supplierName: "Mediterranean Foods" },
  { id: "8", name: "Instant Coffee 200g", category: "Beverages", sellingPrice: 9.99, buyingPrice: 6.00, stockQuantity: 5, barcode: "8901234567897", expiryDate: "2027-12-01", supplierId: "5", supplierName: "Global Imports LLC" },
];

export const mockSuppliers: Supplier[] = [
  { id: "1", name: "FreshFarms Co.", contact: "+1 555-0101", address: "123 Farm Road, Austin, TX", ordersPlaced: 45, deliveryStatus: "delivered" },
  { id: "2", name: "BakeHouse Ltd.", contact: "+1 555-0102", address: "456 Baker St, Portland, OR", ordersPlaced: 30, deliveryStatus: "in-transit" },
  { id: "3", name: "GrainMaster Inc.", contact: "+1 555-0103", address: "789 Mill Ave, Denver, CO", ordersPlaced: 22, deliveryStatus: "delivered" },
  { id: "4", name: "Mediterranean Foods", contact: "+1 555-0104", address: "321 Harbor Blvd, San Diego, CA", ordersPlaced: 18, deliveryStatus: "pending" },
  { id: "5", name: "Global Imports LLC", contact: "+1 555-0105", address: "654 Trade Center, Miami, FL", ordersPlaced: 12, deliveryStatus: "delivered" },
];

export const mockSales: Sale[] = [
  { id: "1", productId: "1", productName: "Organic Milk 1L", quantity: 24, date: "2026-03-19", revenue: 119.76 },
  { id: "2", productId: "2", productName: "Whole Wheat Bread", quantity: 18, date: "2026-03-19", revenue: 62.82 },
  { id: "3", productId: "4", productName: "Basmati Rice 5kg", quantity: 8, date: "2026-03-18", revenue: 103.92 },
  { id: "4", productId: "7", productName: "Tomato Sauce 400g", quantity: 30, date: "2026-03-18", revenue: 89.70 },
  { id: "5", productId: "6", productName: "Cheddar Cheese 200g", quantity: 15, date: "2026-03-17", revenue: 79.35 },
  { id: "6", productId: "8", productName: "Instant Coffee 200g", quantity: 10, date: "2026-03-17", revenue: 99.90 },
  { id: "7", productId: "5", productName: "Olive Oil 500ml", quantity: 6, date: "2026-03-16", revenue: 50.94 },
  { id: "8", productId: "3", productName: "Free Range Eggs (12pk)", quantity: 20, date: "2026-03-16", revenue: 139.80 },
];

export const mockAlerts: Alert[] = [
  { id: "1", type: "low-stock", message: "Stock below threshold (5 units)", productName: "Olive Oil 500ml", severity: "high", date: "2026-03-20" },
  { id: "2", type: "low-stock", message: "Stock below threshold (5 units)", productName: "Instant Coffee 200g", severity: "high", date: "2026-03-20" },
  { id: "3", type: "expiry", message: "Expiring in 5 days", productName: "Whole Wheat Bread", severity: "medium", date: "2026-03-20" },
  { id: "4", type: "low-stock", message: "Stock below threshold (10 units)", productName: "Free Range Eggs (12pk)", severity: "medium", date: "2026-03-19" },
  { id: "5", type: "low-stock", message: "Stock below threshold (15 units)", productName: "Organic Milk 1L", severity: "low", date: "2026-03-19" },
];

export const salesTrendData = [
  { date: "Mar 14", revenue: 420 },
  { date: "Mar 15", revenue: 580 },
  { date: "Mar 16", revenue: 490 },
  { date: "Mar 17", revenue: 620 },
  { date: "Mar 18", revenue: 530 },
  { date: "Mar 19", revenue: 710 },
  { date: "Mar 20", revenue: 650 },
];

export const categoryDistribution = [
  { name: "Dairy", value: 42, fill: "hsl(var(--chart-1))" },
  { name: "Bakery", value: 18, fill: "hsl(var(--chart-2))" },
  { name: "Grains", value: 15, fill: "hsl(var(--chart-3))" },
  { name: "Beverages", value: 12, fill: "hsl(var(--chart-4))" },
  { name: "Other", value: 13, fill: "hsl(var(--chart-5))" },
];

export const forecastData = [
  { week: "W1", actual: 120, predicted: 115 },
  { week: "W2", actual: 135, predicted: 128 },
  { week: "W3", actual: 110, predicted: 118 },
  { week: "W4", actual: 150, predicted: 142 },
  { week: "W5", actual: null, predicted: 155 },
  { week: "W6", actual: null, predicted: 148 },
  { week: "W7", actual: null, predicted: 162 },
  { week: "W8", actual: null, predicted: 170 },
];
