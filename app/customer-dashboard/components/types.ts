// ── Types matching BE CreativeOrderDetail ──────────────────────────────────────
export interface ApiOrder {
  OrderId: number;
  CompanyId: number;
  ProductId: number | null;
  PackageId: number | null;
  ProjectName: string | null;
  ProductName: string | null;
  PackageName: string | null;
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
  NEW:           { label: "Mới (New)",                    color: "text-blue-100", bg: "bg-blue-600/20", borderColor: "border-blue-500/30"  },
  IN_PRODUCTION: { label: "Đang xử lý (In Production)",   color: "text-blue-200", bg: "bg-blue-500/20", borderColor: "border-blue-400/30"  },
  REVIEW:        { label: "Đang đánh giá (Under Review)", color: "text-blue-300", bg: "bg-blue-400/20", borderColor: "border-blue-300/30"  },
  COMPLETED:     { label: "Đã hoàn thành (Completed)",    color: "text-blue-400", bg: "bg-blue-700/30", borderColor: "border-blue-500/40"  },
  DELIVERED:     { label: "Chờ thanh toán (Waiting Pay)", color: "text-blue-50",  bg: "bg-blue-800/40", borderColor: "border-blue-500/50"  },
  CANCELLED:     { label: "Đã hủy (Cancelled)",           color: "text-slate-300",bg: "bg-slate-500/20", borderColor: "border-slate-500/30" },
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