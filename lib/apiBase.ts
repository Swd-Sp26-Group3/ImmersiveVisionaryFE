export function getApiBaseUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!baseUrl) return "https://api.immersivevisionary.name.vn";
    return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

// Absolute URL — dùng cho server-side contexts (middleware, SSR)
export function getAbsoluteApiUrl(endpoint: string): string {
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const baseUrl = getApiBaseUrl();
    const apiPath = normalizedEndpoint.startsWith("/api/")
        ? normalizedEndpoint
        : `/api${normalizedEndpoint}`;
    return `${baseUrl}${apiPath}`;
}

// Relative path — dùng cho client-side fetch, đi qua Next.js proxy → tránh CORS
export function buildApiUrl(endpoint: string): string {
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const apiPath = normalizedEndpoint.startsWith("/api/")
        ? normalizedEndpoint
        : `/api${normalizedEndpoint}`;

    // Server-side (middleware/SSR): cần URL tuyệt đối
    // Client-side (browser): dùng relative path → Next.js rewrite proxy xử lý
    if (typeof window === "undefined") {
        return `${getApiBaseUrl()}${apiPath}`;
    }
    return apiPath;
}