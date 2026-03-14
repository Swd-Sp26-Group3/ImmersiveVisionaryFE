// ===================== Types =====================
export interface CreativeOrder {
  OrderId: number;
  ProductId: number;
  ProductName: string | null;
  CompanyId: number;
  CompanyName: string | null;
  PackageId: number;
  PackageName: string | null;
  Brief: string | null;
  TargetPlatform: string | null;
  Status: "NEW" | "IN_PRODUCTION" | "REVIEW" | "COMPLETED" | "DELIVERED" | "CANCELLED";
  Deadline: string | null;
  CreatedAt: string;
  UpdatedAt: string | null;
}

export interface Asset {
  AssetId: number;
  AssetName: string;
  Description: string | null;
  Category: string | null;
  Industry: string | null;
  Price: number | null;
  PreviewImage: string | null;
  PublishStatus: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";
  IsMarketplace: boolean | number;
  AssetType: string | null;
  CreatedAt: string;
}

// ===================== Config =====================
export const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NEW:           { label: "New",           color: "text-yellow-300", bg: "bg-yellow-500/15 border-yellow-500/30"  },
  IN_PRODUCTION: { label: "In Production", color: "text-blue-300",   bg: "bg-blue-500/15 border-blue-500/30"     },
  REVIEW:        { label: "Under Review",  color: "text-purple-300", bg: "bg-purple-500/15 border-purple-500/30" },
  COMPLETED:     { label: "Completed",     color: "text-green-300",  bg: "bg-green-500/15 border-green-500/30"   },
  DELIVERED:     { label: "Delivered",     color: "text-cyan-300",   bg: "bg-cyan-500/15 border-cyan-500/30"     },
  CANCELLED:     { label: "Cancelled",     color: "text-red-300",    bg: "bg-red-500/15 border-red-500/30"       },
};

export const PUBLISH_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:     { label: "Draft",     color: "text-slate-300",  bg: "bg-slate-500/15 border-slate-500/30"   },
  PENDING:   { label: "Pending",   color: "text-yellow-300", bg: "bg-yellow-500/15 border-yellow-500/30" },
  PUBLISHED: { label: "Published", color: "text-green-300",  bg: "bg-green-500/15 border-green-500/30"   },
  REJECTED:  { label: "Rejected",  color: "text-red-300",    bg: "bg-red-500/15 border-red-500/30"       },
};

export const CATEGORY_IMAGES: Record<string, string> = {
  Cosmetics:         "https://images.unsplash.com/photo-1704621354138-e124277356f2?w=400",
  Fashion:           "https://images.unsplash.com/photo-1746730921484-897eff445c9a?w=400",
  "Food & Beverage": "https://images.unsplash.com/photo-1761076879115-97f22dc68755?w=400",
  Electronics:       "https://images.unsplash.com/photo-1670236246338-c619dec5203c?w=400",
  "Home Decor":      "https://images.unsplash.com/photo-1767958465025-75c050ab10c4?w=400",
  default:           "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
};

export const PRODUCTION_STAGES = [
  { key: "NEW",           label: "Order Received" },
  { key: "IN_PRODUCTION", label: "3D Production"  },
  { key: "REVIEW",        label: "Client Review"  },
  { key: "COMPLETED",     label: "Completed"      },
  { key: "DELIVERED",     label: "Delivered"      },
] as const;