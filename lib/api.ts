import { buildApiUrl, getApiBaseUrl } from "./apiBase";
import { emitForceLogout } from "./authEvents";
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
        // Emit event so AuthContext can use router.push() (soft navigation).
        // This avoids a full-page reload that would wipe React state (e.g. Cart).
        emitForceLogout();
    }
}
export async function apiFetch(
    endpoint: string,
    options: RequestInit = {},
    retry = true
): Promise<Response> {
    const token = getAccessToken();
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };
    if (options.body && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(buildApiUrl(endpoint), { cache: "no-store", ...options, headers });

    // If 401, try to refresh and retry once
    if (res.status === 401 && retry) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            headers["Authorization"] = `Bearer ${newToken}`;
            return apiFetch(endpoint, { cache: "no-store", ...options, headers }, false);
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

export interface ProcessedModel {
    blob: Blob;
    prefix: "zip" | "gzip" | "raw";
}

/**
 * Processes list of 3D model files (OBJ, MTL, textures, ZIP) and returns a raw Blob and its type prefix.
 * If multiple files are uploaded, compresses them into a single DEFLATED zip archive
 * with level 9 compression to minimize payload size.
 */
export async function process3DModelFiles(files: File[]): Promise<ProcessedModel> {
    if (files.length === 1 && files[0].name.toLowerCase().endsWith(".zip")) {
        return { blob: files[0], prefix: "zip" };
    }

    if (files.length === 1 && (
        files[0].name.toLowerCase().endsWith(".obj") ||
        files[0].name.toLowerCase().endsWith(".blend") ||
        files[0].name.toLowerCase().endsWith(".glb") ||
        files[0].name.toLowerCase().endsWith(".gltf")
    )) {
        return { blob: files[0], prefix: "raw" };
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

    return { blob: zipBlob, prefix: "zip" };
}

/**
 * Uploads a large model Blob to the backend in small chunks of raw binary data.
 * Displays progress feedback if a callback is provided.
 */
export async function uploadAttachmentInChunks(
    orderId: number,
    fileName: string,
    mimeType: string,
    model: ProcessedModel,
    onProgress?: (progress: number) => void
): Promise<any> {
    const { blob, prefix } = model;
    const chunkSize = 2 * 1024 * 1024; // 2MB chunk size
    const totalChunks = Math.ceil(blob.size / chunkSize);
    const uploadId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    let lastResult = null;
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, blob.size);
        const chunkBlob = blob.slice(start, end);

        const formData = new FormData();
        formData.append("uploadId", uploadId);
        formData.append("chunkIndex", String(chunkIndex));
        formData.append("totalChunks", String(totalChunks));
        formData.append("prefix", prefix);
        formData.append("fileName", fileName);
        formData.append("mimeType", mimeType);
        formData.append("orderId", String(orderId));
        formData.append("chunk", chunkBlob);

        const res = await apiFetch(`${getApiBaseUrl()}/api/orders/${orderId}/attachments/upload-chunk`, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Upload failed at chunk ${chunkIndex + 1}/${totalChunks}: ${errText}`);
        }

        const data = await res.json();
        lastResult = data.data ?? data;

        if (onProgress) {
            onProgress(Math.round(((chunkIndex + 1) / totalChunks) * 100));
        }
    }

    return lastResult;
}

/**
 * Uploads a large asset model Blob to the backend in small chunks of raw binary data.
 * Displays progress feedback if a callback is provided.
 */
export async function uploadAssetInChunks(
    fileName: string,
    model: ProcessedModel,
    onProgress?: (progress: number) => void
): Promise<{ uploadId: string }> {
    const { blob, prefix } = model;
    const chunkSize = 2 * 1024 * 1024; // 2MB chunk size
    const totalChunks = Math.ceil(blob.size / chunkSize);
    const uploadId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, blob.size);
        const chunkBlob = blob.slice(start, end);

        const formData = new FormData();
        formData.append("uploadId", uploadId);
        formData.append("chunkIndex", String(chunkIndex));
        formData.append("totalChunks", String(totalChunks));
        formData.append("prefix", prefix);
        formData.append("fileName", fileName);
        formData.append("chunk", chunkBlob);

        const res = await apiFetch(`${getApiBaseUrl()}/api/assets/upload-chunk`, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Upload failed at chunk ${chunkIndex + 1}/${totalChunks}: ${errText}`);
        }

        if (onProgress) {
            onProgress(Math.round(((chunkIndex + 1) / totalChunks) * 100));
        }
    }

    return { uploadId };
}

/**
 * Recursively traverses dropped items (files and folders) using webkitGetAsEntry.
 * Preserves the webkitRelativePath for all traversed files so that jszip can
 * accurately reconstruct the directory structure when compressing multi-file folders.
 */
export async function getFilesFromDroppedItems(dataTransfer: DataTransfer): Promise<File[]> {
    const files: File[] = [];
    const items = dataTransfer.items ? Array.from(dataTransfer.items) : [];

    async function traverseEntry(entry: any, path = ""): Promise<void> {
        if (entry.isFile) {
            const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
            // Set webkitRelativePath so process3DModelFiles / JSZip preserves the relative directory structure
            const relativePath = path ? `${path}/${file.name}` : file.name;
            Object.defineProperty(file, "webkitRelativePath", {
                value: relativePath,
                writable: true,
                configurable: true,
            });
            files.push(file);
        } else if (entry.isDirectory) {
            const dirReader = entry.createReader();
            const entries = await new Promise<any[]>((resolve) => {
                const allEntries: any[] = [];
                function readAll() {
                    dirReader.readEntries((results: any[]) => {
                        if (results.length === 0) {
                            resolve(allEntries);
                        } else {
                            allEntries.push(...results);
                            readAll();
                        }
                    });
                }
                readAll();
            });
            for (const subEntry of entries) {
                await traverseEntry(subEntry, path ? `${path}/${entry.name}` : entry.name);
            }
        }
    }

    if (items.length > 0 && typeof items[0].webkitGetAsEntry === "function") {
        const traversePromises = items.map((item) => {
            const entry = item.webkitGetAsEntry();
            if (entry) {
                return traverseEntry(entry);
            }
            return Promise.resolve();
        });
        await Promise.all(traversePromises);
    } else {
        // Fallback for browsers that don't support webkitGetAsEntry
        return dataTransfer.files ? Array.from(dataTransfer.files) : [];
    }

    // Fallback if no files were resolved recursively but standard files are present
    if (files.length === 0 && dataTransfer.files && dataTransfer.files.length > 0) {
        return Array.from(dataTransfer.files);
    }

    return files;
}

export const parseBudgetToPrice = (budgetStr: string): number => {
  if (!budgetStr) return 0;

  const str = budgetStr.toLowerCase().trim();

  const parseSingleValue = (valStr: string): number => {
    let s = valStr.replace(/\s+/g, '');
    
    if (s.includes('m') || s.includes('tr') || s.includes('trieu') || s.includes('triệu')) {
      const normalized = s.replace(/,/g, '.');
      const numPart = parseFloat(normalized.replace(/[^0-9.]/g, '')) || 0;
      return numPart * 1000000;
    }

    if (s.includes('k')) {
      const normalized = s.replace(/,/g, '.');
      const numPart = parseFloat(normalized.replace(/[^0-9.]/g, '')) || 0;
      return numPart * 1000;
    }

    const hasMultipleDotsOrCommas = (s.match(/[.,]/g) || []).length > 1;
    if (hasMultipleDotsOrCommas) {
      s = s.replace(/[.,]/g, '');
    } else {
      const dotIdx = s.indexOf('.');
      const commaIdx = s.indexOf(',');
      const idx = dotIdx !== -1 ? dotIdx : commaIdx;
      if (idx !== -1) {
        const after = s.slice(idx + 1);
        if (after.length === 3 && !isNaN(Number(after))) {
          s = s.replace(/[.,]/g, '');
        } else {
          s = s.replace(/,/g, '.');
        }
      }
    }

    const numPart = parseFloat(s.replace(/[^0-9.]/g, '')) || 0;

    return numPart;
  };

  const rangeSeparators = ['-', 'to', 'đến', '/'];
  for (const sep of rangeSeparators) {
    if (str.includes(sep)) {
      const parts = str.split(sep);
      if (parts.length === 2) {
        const val1 = parseSingleValue(parts[0]);
        const val2 = parseSingleValue(parts[1]);
        return Math.max(val1, val2);
      }
    }
  }

  return parseSingleValue(str);
};

export const formatBudgetToPrice = (budgetStr: string): string => {
  if (!budgetStr) return "";
  const parsed = parseBudgetToPrice(budgetStr);
  return `${parsed.toLocaleString("vi-VN")} ₫`;
};

export default api;

