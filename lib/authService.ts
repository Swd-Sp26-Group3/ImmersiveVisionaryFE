import { apiFetch, clearTokens, setTokens } from "./api";

export interface User {
    id: string;
    email: string;
    name?: string;
    role?: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user?: User;
}

function extractAuthData(data: Record<string, unknown>): AuthResponse {
    // Flexible extraction – handle different response shapes from backend
    const accessToken =
        (data.accessToken as string) ??
        (data.token as string) ??
        ((data.data as Record<string, unknown>)?.accessToken as string) ?? "";
    const refreshToken =
        (data.refreshToken as string) ??
        ((data.data as Record<string, unknown>)?.refreshToken as string) ?? "";
    const user =
        (data.user as User) ??
        ((data.data as Record<string, unknown>)?.user as User) ??
        undefined;
    return { accessToken, refreshToken, user };
}

export async function login(email: string, password: string): Promise<User> {
    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email, PasswordHash: password }),
    });

    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch (e) {
        throw new Error("Lỗi kết nối máy chủ (Backend có thể đang tắt).");
    }

    if (!res.ok) {
        throw new Error(
            data.message ?? data.error ?? "Đăng nhập thất bại. Vui lòng kiểm tra lại."
        );
    }

    const { accessToken, refreshToken, user } = extractAuthData(data);
    if (!accessToken) {
        throw new Error("Không nhận được token từ server.");
    }

    setTokens(accessToken, refreshToken);

    // Persist user info so AuthContext can hydrate from localStorage
    const userObj: User =
    {
        id: data.user?.userId ?? "",
        email: data.user?.email ?? email,
        role: data.user?.role ?? "CUSTOMER",
    }
    localStorage.setItem("user", JSON.stringify(userObj));
    return userObj;
}

export async function register(
    email: string,
    password: string,
    userName?: string,
    phone?: string
): Promise<void> {
    const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            UserName: userName ?? email.split("@")[0], // tự gen username từ email
            Email: email,
            PasswordHash: password,
            ConfirmPassword: password,
            Phone: phone || null,
            CompanyId: null,
        }),
    });

    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch (e) {
        throw new Error("Lỗi kết nối máy chủ (Backend có thể đang tắt).");
    }

    if (!res.ok) {
        throw new Error(
            data.message ?? data.error ?? "Đăng ký thất bại. Vui lòng thử lại."
        );
    }
}

export async function logout(): Promise<void> {
    try {
        await apiFetch("/auth/logout", { method: "DELETE" });
    } catch {
        // Even if the request fails, clear local tokens
    } finally {
        clearTokens();
    }
}

export function getUserFromStorage(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
        return JSON.parse(raw) as User;
    } catch {
        return null;
    }
}
