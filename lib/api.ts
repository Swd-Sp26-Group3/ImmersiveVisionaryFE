const BASE_URL = "/api";

function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
}

function getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
}

const ACCESS_TOKEN_MAX_AGE = 15 * 60        // 900 giây = 15 phút
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 3600 // 604800 giây = 7 ngày

export function setTokens(accessToken: string, refreshToken: string) {
    //Lưu cookie để middleware đọc được (sever-side)
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${ACCESS_TOKEN_MAX_AGE}; SameSite=Strict`;
    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${REFRESH_TOKEN_MAX_AGE}; SameSite=Strict`;
    //Vẫn giữ localStorage cho client-side dùng
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
    // Xóa cookie
    document.cookie = "accessToken=; path=/; max-age=0";
    document.cookie = "refreshToken=; path=/; max-age=0";
    // Xóa localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
}

async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        redirectToLogin();
        return null;
    }

    try {
        const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
            clearTokens();
            redirectToLogin();
            return null;
        }
        const data = await res.json();
        const newAccessToken = data.accessToken ?? data.token ?? data.data?.accessToken;
        const newRefreshToken = data.refreshToken ?? data.data?.refreshToken ?? refreshToken;
        if (newAccessToken) {
            setTokens(newAccessToken, newRefreshToken);
            return newAccessToken;
        }
        redirectToLogin();
        return null;
    } catch {
        clearTokens();
        redirectToLogin();
        return null;
    }
}

function redirectToLogin() {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
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

    if (!res.ok && res.status !== 401) {
        try {
            const clone = res.clone();
            const textData = await clone.text();
            console.error(`API Error RawText [${res.status}] ${endpoint}:`, textData);
            const errData = JSON.parse(textData);
            console.error(`API Error [${res.status}] ${endpoint}:`, errData);
        } catch {
            console.error(`API Error [${res.status}] ${endpoint}`);
        }
    }

    return res;
}
