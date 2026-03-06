const BASE_URL = "/api";

function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
}

function getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
}

export function setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
}

async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
        const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
            clearTokens();
            return null;
        }
        const data = await res.json();
        const newAccessToken = data.accessToken ?? data.token ?? data.data?.accessToken;
        const newRefreshToken = data.refreshToken ?? data.data?.refreshToken ?? refreshToken;
        if (newAccessToken) {
            setTokens(newAccessToken, newRefreshToken);
            return newAccessToken;
        }
        return null;
    } catch {
        clearTokens();
        return null;
    }
}

export async function apiFetch(
    endpoint: string,
    options: RequestInit = {},
    retry = true
): Promise<Response> {
    const token = getAccessToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

    // If 401, try to refresh and retry once
    if (res.status === 401 && retry) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            headers["Authorization"] = `Bearer ${newToken}`;
            return apiFetch(endpoint, { ...options, headers }, false);
        }
        // Refresh failed – clear tokens and let caller handle it
        clearTokens();
    }

    return res;
}
