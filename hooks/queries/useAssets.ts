import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Asset } from "@/lib/types";

// ─── Query Keys ────────────────────────────────────────────────────────────
// Centralise all keys so invalidation is consistent across the app.
export const assetKeys = {
  all: ["assets"] as const,
  marketplace: () => [...assetKeys.all, "marketplace"] as const,
  detail: (id: number) => [...assetKeys.all, "detail", id] as const,
};

// ─── Fetchers ───────────────────────────────────────────────────────────────

async function fetchMarketplaceAssets(): Promise<Asset[]> {
  const res = await apiFetch("/assets/marketplace");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const rawAssets: Asset[] = data.data ?? data;

  // Normalize: remove assets with invalid/placeholder categories
  return rawAssets
    .filter(
      (a) =>
        a.Category &&
        typeof a.Category === "string" &&
        a.Category.trim() !== "" &&
        !a.Category.includes("CATEGORY_IMAGES")
    )
    .map((a) => ({ ...a, Category: a.Category!.trim() }));
}

async function fetchAssetDetail(assetId: number): Promise<Asset> {
  const res = await apiFetch(`/assets/${assetId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.data ?? data;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Fetches all marketplace assets with 5-minute caching.
 * Navigating back to the marketplace page will NOT trigger a new network request
 * until the staleTime expires.
 */
export function useMarketplaceAssets() {
  return useQuery<Asset[], Error>({
    queryKey: assetKeys.marketplace(),
    queryFn: fetchMarketplaceAssets,
  });
}

/**
 * Fetches a single asset by ID.
 * Uses the same cache key structure so the marketplace list and detail views
 * share data where possible.
 */
export function useAssetDetail(assetId: number | null) {
  return useQuery<Asset, Error>({
    queryKey: assetKeys.detail(assetId!),
    queryFn: () => fetchAssetDetail(assetId!),
    enabled: assetId != null,
  });
}

/**
 * Returns a function to manually invalidate the marketplace cache.
 * Use after creating/deleting an asset.
 */
export function useInvalidateMarketplace() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: assetKeys.marketplace() });
}
