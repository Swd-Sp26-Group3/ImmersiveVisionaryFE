export interface Product {
  ProductId: number;
  ProductName: string;
  Description: string | null;
  Category: string | null;
  SizeInfo: string | null;
  ColorInfo: string | null;
  CompanyId: number;
  CreatedAt: string;
  UpdatedAt: string | null;
}

export interface Company {
  CompanyId: number;
  CompanyName: string;
  Address: string | null;
  Email: string | null;
  Phone: string | null;
  Website: string | null;
  CompanyType: "BRAND" | "AGENCY" | "STUDIO" | "SELLER" | null;
  Status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | null;
  CreatedAt: string;
  UpdatedAt: string | null;
}

export interface Artist {
  UserId: number;
  UserName: string;
  Email: string | null;
  Phone: string | null;
  RoleName: string;
  IsActive: boolean;
}

//CreativeOrderDetail (orderService)
export type CreativeOrderStatus =
  | "NEW"
  | "IN_PRODUCTION"
  | "REVIEW"
  | "COMPLETED"
  | "DELIVERED"
  | "CANCELLED";

export interface CreativeOrder {
  OrderId: number;
  CompanyId: number;
  ProductId: number;
  PackageId: number;
  ProjectName: string | null;
  Brief: string | null;
  Budget: string | null;
  TargetPlatform: string | null;
  Status: CreativeOrderStatus;
  Deadline: string | null;
  CreatedAt: string;
  UpdatedAt: string | null;
  IsDeleted: boolean;
  CompanyName: string | null;
  ProductName: string | null;
  PackageName: string | null;
}

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NEW: { label: "New", color: "bg-yellow-600" },
  IN_PRODUCTION: { label: "In Production", color: "bg-blue-600" },
  REVIEW: { label: "Review", color: "bg-purple-600" },
  COMPLETED: { label: "Completed", color: "bg-green-600" },
  DELIVERED: { label: "Approved (Waiting Pay)", color: "bg-cyan-600" },
  CANCELLED: { label: "Cancelled", color: "bg-red-600" },
};

export const COMPANY_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "bg-green-600" },
  INACTIVE: { label: "Inactive", color: "bg-slate-600" },
  SUSPENDED: { label: "Suspended", color: "bg-red-600" },
};