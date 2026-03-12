const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
}

function getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
}

const ACCESS_TOKEN_MAX_AGE  = 15 * 60;           // 900s = 15 phút
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 3600;     // 604800s = 7 ngày

export function setTokens(accessToken: string, refreshToken: string) {
    // Cookie để middleware Next.js đọc được (server-side)
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${ACCESS_TOKEN_MAX_AGE}; SameSite=Strict`;
    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${REFRESH_TOKEN_MAX_AGE}; SameSite=Strict`;
    // localStorage cho client-side
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
    document.cookie = "accessToken=; path=/; max-age=0";
    document.cookie = "refreshToken=; path=/; max-age=0";
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
}

// Flag tránh nhiều request cùng lúc đều trigger refresh
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    // Nếu đang refresh rồi thì chờ cùng 1 promise, không gọi lại
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        dispatchUnauthorized();
        return null;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            // Dùng fetch trực tiếp, KHÔNG dùng apiFetch để tránh vòng lặp vô hạn
            const res = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });

            if (!res.ok) {
                clearTokens();
                dispatchUnauthorized();
                return null;
            }

            const data = await res.json();
            const newAccessToken  = data.accessToken  ?? data.token ?? data.data?.accessToken;
            const newRefreshToken = data.refreshToken ?? data.data?.refreshToken ?? refreshToken;

            if (!newAccessToken) {
                clearTokens();
                dispatchUnauthorized();
                return null;
            }

            setTokens(newAccessToken, newRefreshToken);
            return newAccessToken as string;
        } catch {
            clearTokens();
            dispatchUnauthorized();
            return null;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

/**
 * Phát event để AuthContext bắt và forceLogout.
 * Dùng event thay vì window.location trực tiếp để tránh
 * redirect cứng khi đang ở trang public.
 */
function dispatchUnauthorized() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:unauthorized"));
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
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${BASE_URL}/api${endpoint}`, { ...options, headers });

    if (res.status === 401 && retry) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            // Retry 1 lần với token mới
            return apiFetch(endpoint, { ...options, headers }, false);
        }
        // Refresh thất bại → AuthContext logout qua event
        return res;
    }

    return res;
}