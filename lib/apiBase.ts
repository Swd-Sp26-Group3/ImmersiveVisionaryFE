export function getApiBaseUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!baseUrl) return "/api";
    return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export function buildApiUrl(endpoint: string): string {
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const baseUrl = getApiBaseUrl();

    if (baseUrl === "/api") {
        return `${baseUrl}${normalizedEndpoint}`;
    }

    return `${baseUrl}${normalizedEndpoint}`;
}