// ── Types matching BE CreativeOrderDetail ──
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

export const MOCK_ORDERS = [
  {
    id: "ORD-001",
    title: "Luxury Perfume AR Campaign",
    status: "In 3D Modeling",
    progress: 65,
    date: "2026-02-28",
    thumbnail: "https://images.unsplash.com/photo-1704621354138-e124277356f2?w=400",
  },
  {
    id: "ORD-002",
    title: "Fashion Collection Showcase",
    status: "Waiting for Photo Shoot",
    progress: 30,
    date: "2026-02-25",
    thumbnail: "https://images.unsplash.com/photo-1746730921484-897eff445c9a?w=400",
  },
  {
    id: "ORD-003",
    title: "Food Menu 3D Visualization",
    status: "Completed",
    progress: 100,
    date: "2026-02-20",
    thumbnail: "https://images.unsplash.com/photo-1761076879115-97f22dc68755?w=400",
  },
];

export const MOCK_PURCHASES = [
  { id: "PUR-001", title: "Premium Cosmetics Pack", date: "2026-02-15", price: "$299" },
  { id: "PUR-002", title: "AR Furniture Bundle", date: "2026-02-10", price: "$449" },
];

// ── Status config matching BE CreativeOrderStatus enum ──
export const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: "New", color: "text-yellow-300", bg: "bg-yellow-600" },
  IN_PRODUCTION: { label: "In Production", color: "text-blue-300", bg: "bg-blue-600" },
  REVIEW: { label: "Under Review", color: "text-purple-300", bg: "bg-purple-600" },
  COMPLETED: { label: "Completed", color: "text-green-300", bg: "bg-green-600" },
  DELIVERED: { label: "Approved (Waiting Pay)", color: "text-cyan-300", bg: "bg-cyan-600" },
  CANCELLED: { label: "Cancelled", color: "text-red-300", bg: "bg-red-600" },
};

export const getStatusLabel = (status: string) =>
  ORDER_STATUS_CONFIG[status]?.label ?? status;

// ── Progress mapping: derive % from status ──
export const getOrderProgress = (status: string): number => {
  switch (status) {
    case "NEW": return 10;
    case "IN_PRODUCTION": return 40;
    case "REVIEW": return 70;
    case "COMPLETED": return 90;
    case "DELIVERED": return 100;
    case "CANCELLED": return 0;
    default: return 0;
  }
};

export const getStatusIcon = (status: string) => {
  if (status === "Completed" || status === "COMPLETED") return "completed";
  if (status === "In 3D Modeling" || status === "IN_PRODUCTION") return "modeling";
  return "waiting";
};

export const getStatusColor = (status: string) => {
  if (status === "Completed" || status === "COMPLETED") return "bg-green-600";
  if (status === "In 3D Modeling" || status === "IN_PRODUCTION") return "bg-blue-600";
  return ORDER_STATUS_CONFIG[status]?.bg ?? "bg-yellow-600";
};