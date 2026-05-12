// ─────────────────────────────────────────────────────────────────────────────
// Shared types used across FE components — single source of truth
// ─────────────────────────────────────────────────────────────────────────────

/** File attachment linked to a creative order */
export interface Attachment {
  AttachmentId: number;
  FileName: string;
  MimeType: string;
  Base64Data: string;
  CreatedAt: string;
}

/** Marketplace (asset) order from /marketplace-orders */
export interface MarketplaceOrder {
  MpOrderId: number;
  AssetId: number;
  BuyerCompanyId: number;
  SellerCompanyId: number;
  Price: number | null;
  Status: "PENDING" | "PAID" | "DELIVERED" | "REFUNDED";
  CreatedAt: string;
  AssetName?: string | null;
  Category?: string | null;
  Industry?: string | null;
  SellerCompanyName?: string | null;
}

/** 3D Asset from /assets */
export interface Asset {
  AssetId: number;
  AssetName: string;
  Description: string | null;
  Category: string | null;
  Industry: string | null;
  Price: number | null;
  PreviewImage: string | null;
  Base64Data: string | null;
  PublishStatus: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";
  IsMarketplace: boolean | number;
  AssetType: string | null;
  OwnerCompanyId?: number | null;
  CreatedAt: string;
}

/** Asset download version */
export interface AssetVersion {
  VersionId: number;
  FileFormat: "GLB" | "USDZ" | "FBX" | "WEBAR";
  FileUrl: string | null;
}
