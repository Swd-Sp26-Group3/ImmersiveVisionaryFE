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
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
        return endpoint;
    }
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const apiPath = normalizedEndpoint.startsWith("/api/")
        ? normalizedEndpoint
        : `/api${normalizedEndpoint}`;

    // Server-side (middleware/SSR): cần URL tuyệt đối để gọi thẳng backend
    if (typeof window === "undefined") {
        return `${getApiBaseUrl()}${apiPath}`;
    }

    // Client-side (browser): LUÔN dùng relative path /api/...
    // → request đi qua Next.js rewrite proxy trên Vercel server → không bị CORS
    // NEXT_PUBLIC_API_URL chỉ dùng server-side, không expose ra browser
    return apiPath;
}