import { buildApiUrl, getApiBaseUrl } from "./apiBase";
export { getApiBaseUrl };

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
        const res = await fetch(buildApiUrl("/auth/refresh-token"), {
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

    const res = await fetch(buildApiUrl(endpoint), { ...options, headers });

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

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await apiFetch(endpoint, options);
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API Error (${response.status}) on ${endpoint}:`, errorBody);
        try {
            const errorJson = JSON.parse(errorBody);
            throw new Error(errorJson.message || `Request failed with status ${response.status}`);
        } catch {
            throw new Error(errorBody || `Request failed with status ${response.status}`);
        }
    }
    const data = await response.json();
    return data as T;
}

const api = {
    async get<T>(endpoint: string, token?: string): Promise<T> {
        return request<T>(endpoint, {
            method: 'GET',
        });
    },

    async post<T>(endpoint: string, body: any, token?: string): Promise<T> {
        return request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    async put<T>(endpoint:string, body: any, token?: string): Promise<T> {
        return request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },

    async delete<T>(endpoint: string, token?: string): Promise<T> {
        return request<T>(endpoint, {
            method: 'DELETE',
        });
    },
};

/**
 * Converts a Blob or File to a Base64 string without data URL prefix.
 * Uses native FileReader which is memory-efficient and fast.
 */
export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1] || result;
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Compresses a File using Gzip via CompressionStream and returns "gzip:<base64>".
 * Super fast, low memory footprint.
 */
export async function compressFileToGzipBase64(file: File): Promise<string> {
    const cs = new CompressionStream("gzip");
    const compressedStream = file.stream().pipeThrough(cs);
    const response = new Response(compressedStream);
    const blob = await response.blob();
    const b64 = await blobToBase64(blob);
    return `gzip:${b64}`;
}

/**
 * Processes list of 3D model files (OBJ, MTL, textures, ZIP) and returns base64.
 * If multiple files are uploaded, compresses them into a single DEFLATED zip archive
 * with level 9 compression to minimize payload size.
 */
export async function process3DModelFiles(files: File[]): Promise<string> {
    if (files.length === 1 && files[0].name.toLowerCase().endsWith(".zip")) {
        const b64 = await blobToBase64(files[0]);
        return `zip:${b64}`;
    }

    if (files.length === 1 && (
        files[0].name.toLowerCase().endsWith(".obj") ||
        files[0].name.toLowerCase().endsWith(".blend") ||
        files[0].name.toLowerCase().endsWith(".glb") ||
        files[0].name.toLowerCase().endsWith(".gltf")
    )) {
        return compressFileToGzipBase64(files[0]);
    }

    const hasModel = files.some(f => {
        const name = f.name.toLowerCase();
        return name.endsWith(".obj") || name.endsWith(".blend") || name.endsWith(".glb") || name.endsWith(".gltf");
    });
    if (!hasModel) {
        throw new Error("No 3D model file (.obj, .blend, .glb, .gltf) found in the selected files.");
    }

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const f of files) {
        // Preserve relative folder structure when directory uploading
        const zipPath = (f as any).webkitRelativePath || f.name;
        zip.file(zipPath, f);
    }

    // Generate deflated zip to optimize payload size
    const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
    });

    const b64 = await blobToBase64(zipBlob);
    return `zip:${b64}`;
}

export default api;

