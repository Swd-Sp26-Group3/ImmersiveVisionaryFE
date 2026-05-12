// ── Types matching BE CreativeOrderDetail ──────────────────────────────────────
export interface ApiOrder {
  OrderId: number;
  CompanyId: number;
  ProductId: number | null;
  PackageId: number | null;
  ProjectName: string | null;
  ProductType: string | null;
  Budget: string | null;
  DeliverySpeed: string | null;
  TargetPlatform: string | null;
  Brief: string | null;
  Status: "NEW" | "IN_PRODUCTION" | "REVIEW" | "COMPLETED" | "DELIVERED" | "CANCELLED";
  Deadline: string | null;
  CreatedAt: string;
  UpdatedAt: string | null;
  CompanyName: string | null;
  ProductName: string | null;
  PackageName: string | null;
}

export interface UserProfile {
  UserId: number;
  UserName: string;
  Email: string;
  Phone: string | null;
  CompanyId: number | null;
  CompanyName: string | null;
  RoleId: number;
  RoleName: string;
  CreatedAt: string;
  UpdatedAt: string | null;
}

// ── Status config matching BE CreativeOrderStatus enum ─────────────────────────
export const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; borderColor?: string }> = {
  NEW:           { label: "New",                      color: "text-yellow-300", bg: "bg-yellow-500/15", borderColor: "border-yellow-500/30"  },
  IN_PRODUCTION: { label: "In Production",            color: "text-blue-300",   bg: "bg-blue-500/15",   borderColor: "border-blue-500/30"    },
  REVIEW:        { label: "Under Review",             color: "text-purple-300", bg: "bg-purple-500/15", borderColor: "border-purple-500/30"  },
  COMPLETED:     { label: "Completed",                color: "text-green-300",  bg: "bg-green-500/15",  borderColor: "border-green-500/30"   },
  DELIVERED:     { label: "Approved (Waiting Pay)",   color: "text-cyan-300",   bg: "bg-cyan-500/15",   borderColor: "border-cyan-500/30"    },
  CANCELLED:     { label: "Cancelled",                color: "text-red-300",    bg: "bg-red-500/15",    borderColor: "border-red-500/30"     },
};

export const getStatusLabel = (status: string) =>
  ORDER_STATUS_CONFIG[status]?.label ?? status;

// ── Progress mapping: derive % from status ─────────────────────────────────────
export const getOrderProgress = (status: string): number => {
  switch (status) {
    case "NEW":           return 10;
    case "IN_PRODUCTION": return 40;
    case "REVIEW":        return 70;
    case "COMPLETED":     return 90;
    case "DELIVERED":     return 100;
    case "CANCELLED":     return 0;
    default:              return 0;
  }
};

/** Returns a Tailwind bg class string for a given status */
export const getStatusColor = (status: string): string =>
  ORDER_STATUS_CONFIG[status]?.bg ?? "bg-slate-500/15";