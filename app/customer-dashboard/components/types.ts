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

export const getStatusIcon = (status: string) => {
  // Returns string identifier — icon rendered in component
  if (status === "Completed") return "completed";
  if (status === "In 3D Modeling") return "modeling";
  return "waiting";
};

export const getStatusColor = (status: string) => {
  if (status === "Completed") return "bg-green-600";
  if (status === "In 3D Modeling") return "bg-blue-600";
  return "bg-yellow-600";
};