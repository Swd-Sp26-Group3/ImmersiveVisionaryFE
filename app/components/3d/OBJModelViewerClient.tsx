"use client";
import React, { Suspense, useMemo, useEffect, useState, useRef } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage, Center, Environment } from "@react-three/drei";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { TGALoader } from "three/addons/loaders/TGALoader.js";
import * as THREE from "three";
import JSZip from "jszip";

const { Timer } = THREE;

// Suppress THREE.Clock deprecation warnings from internal libraries (e.g. Fiber)
if (typeof window !== "undefined") {
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
        if (args[0] && typeof args[0] === "string" && args[0].includes("THREE.Clock: This module has been deprecated")) {
            return;
        }
        originalWarn(...args);
    };
}

interface OBJModelViewerProps {
    /** Base64 string or URL of the .obj file / .zip file */
    objData: string;
}

interface ZipModelData {
    objBlobUrl: string;
    mtlBlobUrl: string | null;
    textureMap: Record<string, string>;
    /** True when an MTL exists but the ZIP contained no texture image files */
    texturesMissing: boolean;
    /** True when the MTL references textures but NONE of them matched a ZIP file (all fell back to white) */
    allTexturesMissing: boolean;
}

// Removed hardcoded texture generators.

function postProcessObject(object: THREE.Object3D, applyFallbackMaterial = false) {
    // BUG 1 FIX: pre-create a shared fallback material so models without textures
    // render as neutral grey instead of broken-looking bright white.
    const fallbackMat = applyFallbackMaterial
        ? new THREE.MeshStandardMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide, roughness: 0.8, metalness: 0.1 })
        : null;

    object.traverse((child: any) => {
        if (child.isMesh) {
            if (child.geometry) {
                // Compute normals to prevent shader NaN crashes with lighting
                child.geometry.computeVertexNormals();
                // Recompute bounds to ensure Stage and raycasters don't fail
                child.geometry.computeBoundingSphere();
                child.geometry.computeBoundingBox();
            }

            // BUG 1 FIX: override material with neutral grey when no textures are present
            if (fallbackMat) {
                child.material = fallbackMat;
                return;
            }

            if (child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((mat: any) => {
                    // Make double sided so models without thickness render correctly
                    mat.side = THREE.DoubleSide;
                    // Prevent precision crashes by forcing medium precision on the material
                    mat.precision = 'mediump';

                    // Ensure transparency flag matches opacity
                    if (mat.opacity < 1.0) {
                        mat.transparent = true;
                    }

                    // FIX (Problem 4): Set correct colorSpace on diffuse/emissive/specular textures.
                    // Three.js r152+ requires SRGBColorSpace for color-data textures; without this
                    // colors render too dark or washed out even when the texture is loaded correctly.
                    if (mat.map) {
                        mat.map.colorSpace = THREE.SRGBColorSpace;
                    }
                    if (mat.emissiveMap) {
                        mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
                    }
                    if (mat.specularMap) {
                        mat.specularMap.colorSpace = THREE.SRGBColorSpace;
                    }

                    // Enhance emissive materials to simulate neon/holographic glow
                    if (mat.emissive && (mat.emissive.r > 0 || mat.emissive.g > 0 || mat.emissive.b > 0)) {
                        mat.emissiveIntensity = 3.0; // Boost glow brightness
                        mat.toneMapped = false;      // Bypass tone mapping to render self-luminous colors vibrantly
                    }

                    mat.needsUpdate = true;
                });
            }
        }
    });
}

function Model({ blobUrl }: { blobUrl: string }) {
    // useLoader handles caching and Suspense automatically
    const obj = useLoader(OBJLoader as any, blobUrl);

    const processedObj = useMemo(() => {
        if (!obj) return null;

        // Clone to avoid mutating cached suspense object
        const clone = obj.clone(true);
        postProcessObject(clone);
        return clone;
    }, [obj]);

    // Clean up when unmounted or blobUrl changes
    useEffect(() => {
        return () => {
            if (processedObj) {
                processedObj.traverse((child: any) => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            const materialsList = Array.isArray(child.material) ? child.material : [child.material];
                            materialsList.forEach((mat: any) => {
                                for (const key in mat) {
                                    if (mat[key] && typeof mat[key].dispose === "function" && mat[key] instanceof THREE.Texture) {
                                        mat[key].dispose();
                                    }
                                }
                                mat.dispose();
                            });
                        }
                    }
                });
            }
            try {
                useLoader.clear(OBJLoader as any, blobUrl);
            } catch (err) {
                console.error("Error clearing OBJLoader cache:", err);
            }
        };
    }, [processedObj, blobUrl]);

    if (!processedObj) return null;

    return (
        <Center>
            <primitive object={processedObj} />
        </Center>
    );
}

function ZippedModelWithMaterials({
    objBlobUrl,
    mtlBlobUrl,
    textureMap,
    texturesMissing,
    allTexturesMissing,
}: {
    objBlobUrl: string;
    mtlBlobUrl: string;
    textureMap: Record<string, string>;
    texturesMissing: boolean;
    allTexturesMissing: boolean;
}) {
    // FIX (Problem 1): The MTL text already has inline blob URLs written in by processModel()
    // (every map_Kd / map_Ka / etc. path was replaced with the actual blob: URL before the MTL
    // blob was created). Running URLModifier on top causes double-resolution and wrong URLs.
    // → Remove URLModifier entirely.
    //
    // FIX (Problem 2): Register TGALoader on a LoadingManager so .tga textures referenced in
    // the MTL are decoded by Three.js instead of being handed to the browser as an <img> tag
    // (browsers cannot natively decode TGA).
    const materials = useLoader(MTLLoader as any, mtlBlobUrl, (loader: any) => {
        const manager = new THREE.LoadingManager();
        manager.addHandler(/\.tga$/i, new (TGALoader as any)(manager));
        loader.manager = manager;
    });

    // ── Reference-inspired: inject textures directly into materials ──
    // Build a basename → blob URL lookup from the textureMap so we can
    // match by filename without caring about directory structure.
    const basenameToUrl = useMemo(() => {
        const map: Record<string, string> = {};
        for (const [key, url] of Object.entries(textureMap)) {
            const basename = decodeURIComponent(key)
                .replace(/\\/g, "/")
                .split("/")
                .pop()
                ?.toLowerCase() || "";
            if (basename) map[basename] = url;
        }
        return map;
    }, [textureMap]);

    // After MTLLoader resolves, scan materialsInfo for any map reference that
    // still points to a data: fallback (meaning preprocessing missed it) and
    // directly assign the correct blob URL via TextureLoader. This mirrors the
    // reference pattern: "inject textures into materials BEFORE preload()".
    useMemo(() => {
        if (!materials || !Object.keys(basenameToUrl).length) return;

        const creator = materials as any;
        const matInfoMap: Record<string, any> = creator.materialsInfo || {};
        const matObjMap: Record<string, any> = creator.materials || {};
        const texLoader = new THREE.TextureLoader();

        // Map keys from MTL spec → Three.js material property
        const mapFields: Array<[string, string]> = [
            ["map_kd",   "map"],
            ["map_ka",   "aoMap"],
            ["map_ks",   "specularMap"],
            ["map_bump", "bumpMap"],
            ["bump",     "bumpMap"],
            ["map_d",    "alphaMap"],
        ];

        Object.entries(matInfoMap).forEach(([matName, info]) => {
            const mat = matObjMap[matName];
            if (!mat || !info) return;

            mapFields.forEach(([infoKey, matProp]) => {
                // Skip if Three.js already loaded a real texture for this slot
                if ((mat as any)[matProp]) return;

                const storedPath: string = info[infoKey] || "";
                if (!storedPath) return;

                // Extract the basename from whatever path MTL stored
                const basename = decodeURIComponent(storedPath)
                    .replace(/\\/g, "/")
                    .split("/")
                    .pop()
                    ?.toLowerCase() || "";

                const blobUrl = basenameToUrl[basename];
                if (!blobUrl) return;

                console.log(`[3D Loader] Injecting texture "${basename}" → material "${matName}.${matProp}"`);
                const tex = texLoader.load(blobUrl);
                // Diffuse maps need SRGBColorSpace for correct colour rendering
                if (matProp === "map") tex.colorSpace = THREE.SRGBColorSpace;
                (mat as any)[matProp] = tex;
                mat.needsUpdate = true;
            });
        });
    }, [materials, basenameToUrl]);

    // Load OBJ model and apply materials
    const obj = useLoader(OBJLoader as any, objBlobUrl, (loader: any) => {
        materials.preload();
        loader.setMaterials(materials);
    });

    const processedObj = useMemo(() => {
        if (!obj) return null;
        const clone = obj.clone(true);
        // Apply grey fallback when:
        //  - texturesMissing: ZIP had no image files at all
        //  - allTexturesMissing: ZIP had images but none matched what the MTL referenced
        postProcessObject(clone, texturesMissing || allTexturesMissing);
        return clone;
    }, [obj, texturesMissing, allTexturesMissing]);

    // Clean up when unmounted or blob URLs change
    useEffect(() => {
        return () => {
            if (processedObj) {
                processedObj.traverse((child: any) => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            const materialsList = Array.isArray(child.material) ? child.material : [child.material];
                            materialsList.forEach((mat: any) => {
                                for (const key in mat) {
                                    if (mat[key] && typeof mat[key].dispose === "function" && mat[key] instanceof THREE.Texture) {
                                        mat[key].dispose();
                                    }
                                }
                                mat.dispose();
                            });
                        }
                    }
                });
            }
            try {
                useLoader.clear(OBJLoader as any, objBlobUrl);
                useLoader.clear(MTLLoader as any, mtlBlobUrl);
            } catch (err) {
                console.error("Error clearing ZippedModel loader cache:", err);
            }
        };
    }, [processedObj, objBlobUrl, mtlBlobUrl]);

    if (!processedObj) return null;

    return (
        <Center>
            <primitive object={processedObj} />
        </Center>
    );
}

function SimpleModel({ objBlobUrl }: { objBlobUrl: string }) {
    const obj = useLoader(OBJLoader as any, objBlobUrl);

    const processedObj = useMemo(() => {
        if (!obj) return null;
        const clone = obj.clone(true);
        postProcessObject(clone);
        return clone;
    }, [obj]);

    // Clean up when unmounted or blobUrl changes
    useEffect(() => {
        return () => {
            if (processedObj) {
                processedObj.traverse((child: any) => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            const materialsList = Array.isArray(child.material) ? child.material : [child.material];
                            materialsList.forEach((mat: any) => {
                                for (const key in mat) {
                                    if (mat[key] && typeof mat[key].dispose === "function" && mat[key] instanceof THREE.Texture) {
                                        mat[key].dispose();
                                    }
                                }
                                mat.dispose();
                            });
                        }
                    }
                });
            }
            try {
                useLoader.clear(OBJLoader as any, objBlobUrl);
            } catch (err) {
                console.error("Error clearing SimpleModel loader cache:", err);
            }
        };
    }, [processedObj, objBlobUrl]);

    return (
        <Center>
            <primitive object={processedObj} />
        </Center>
    );
}

// Custom robust Base64 to Uint8Array decoder.
// Bypasses browser atob() entirely to prevent any possible InvalidCharacterError.
// It ignores invalid characters, handles URL-safe base64, and handles padding automatically.
const base64ToBytes = (str: string): Uint8Array => {
    let cleanStr = str;
    const commaIdx = cleanStr.indexOf(",");
    if (commaIdx !== -1) {
        cleanStr = cleanStr.slice(commaIdx + 1);
    }

    // Decode URL-encoded base64 characters directly
    cleanStr = cleanStr.replace(/%2B/gi, "+").replace(/%2F/gi, "/").replace(/%3D/gi, "=");

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    
    // Support URL-safe base64 characters by mapping them
    const normalized: string[] = [];
    for (let i = 0; i < cleanStr.length; i++) {
        const char = cleanStr[i];
        if (char === "-") normalized.push("+");
        else if (char === "_") normalized.push("/");
        else if (alphabet.indexOf(char) !== -1) {
            normalized.push(char);
        }
    }
    const clean = normalized.join("");
    
    // Build lookup table
    const lookup = new Uint8Array(256);
    for (let i = 0; i < alphabet.length; i++) {
        lookup[alphabet.charCodeAt(i)] = i;
    }
    
    const len = clean.length;
    const numBytes = Math.floor((len * 3) / 4);
    const bytes = new Uint8Array(numBytes);
    
    let p = 0;
    for (let i = 0; i < len; i += 4) {
        const c1 = lookup[clean.charCodeAt(i)] || 0;
        const c2 = lookup[clean.charCodeAt(i + 1)] || 0;
        const c3 = lookup[clean.charCodeAt(i + 2)] || 0;
        const c4 = lookup[clean.charCodeAt(i + 3)] || 0;
        
        if (p < numBytes) bytes[p++] = (c1 << 2) | (c2 >> 4);
        if (p < numBytes) bytes[p++] = ((c2 & 15) << 4) | (c3 >> 2);
        if (p < numBytes) bytes[p++] = ((c3 & 3) << 6) | c4;
    }
    
    return bytes;
};

const decompressIfGzip = async (bytes: Uint8Array): Promise<Uint8Array> => {
    // Check for GZIP magic header: 0x1f 0x8b
    if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
        try {
            const ds = new DecompressionStream("gzip");
            const writer = ds.writable.getWriter();
            writer.write(bytes as any);
            writer.close();
            
            const chunks: Uint8Array[] = [];
            const reader = ds.readable.getReader();
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                chunks.push(value);
            }
            
            const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
            const decompressed = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                decompressed.set(chunk, offset);
                offset += chunk.length;
            }
            return decompressed;
        } catch (err) {
            console.error("Failed client-side decompression of gzip bytes:", err);
            return bytes;
        }
    }
    return bytes;
};

export default function OBJModelViewer({ objData }: OBJModelViewerProps) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [zipModelData, setZipModelData] = useState<ZipModelData | null>(null);
    const activeBlobUrlsRef = useRef<string[]>([]);
    const glRef = useRef<THREE.WebGLRenderer | null>(null);

    // Force WebGL Context Loss and dispose of the renderer on unmount to free GPU contexts
    useEffect(() => {
        return () => {
            if (glRef.current) {
                try {
                    const gl = glRef.current;
                    const context = gl.getContext();
                    if (context && typeof context.isContextLost === "function" && !context.isContextLost()) {
                        if (typeof gl.forceContextLoss === "function") {
                            gl.forceContextLoss();
                        }
                    }
                    gl.dispose();
                } catch (e) {
                    console.error("Failed to dispose WebGL renderer on unmount:", e);
                }
                glRef.current = null;
            }
        };
    }, []);

    const revokeUrls = (urls: string[]) => {
        if (urls.length > 0) {
            setTimeout(() => {
                urls.forEach((url) => {
                    try {
                        if (url.startsWith("blob:")) {
                            URL.revokeObjectURL(url);
                        }
                    } catch (e) {
                        console.error("Failed to revoke URL:", url, e);
                    }
                });
            }, 1500);
        }
    };

    // Create a Blob URL from the Base64 data with proper lifecycle management
    useEffect(() => {
        if (!objData) {
            setBlobUrl(null);
            setZipModelData(null);
            return;
        }

        const prevUrls = [...activeBlobUrlsRef.current];
        activeBlobUrlsRef.current = [];
        let isCancelled = false;

        const processModel = async () => {
            try {
                let dataToProcess = objData;
                let isZip = false;
                let isGzip = false;
                
                if (dataToProcess.startsWith("zip:")) {
                    dataToProcess = dataToProcess.slice(4);
                    isZip = true;
                } else if (dataToProcess.startsWith("gzip:")) {
                    dataToProcess = dataToProcess.slice(5);
                    isGzip = true;
                }

                let bytes: Uint8Array | null = null;
                const isBase64 = dataToProcess.length > 500 && !dataToProcess.includes(" ") && !dataToProcess.includes("\n");

                if (isZip || isGzip || isBase64 || dataToProcess.startsWith("data:")) {
                    bytes = base64ToBytes(dataToProcess);
                }

                // Check magic bytes for ZIP: PK\x03\x04 (0x50 0x4b 0x03 0x04)
                if (bytes && bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
                    isZip = true;
                }

                // Check magic bytes for GZIP: 0x1f 0x8b
                if (bytes && bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
                    isGzip = true;
                }

                if (isZip && bytes) {
                    const zip = await JSZip.loadAsync(bytes);
                    const fileKeys = Object.keys(zip.files).filter((key) => {
                        // Ignore macOS metadata and hidden files to prevent them from hijacking the load
                        if (key.includes("__MACOSX")) return false;
                        const filename = key.split(/[/\\]/).pop() || "";
                        if (filename.startsWith(".")) return false;
                        // BUG 4 FIX: skip Windows/macOS system metadata files
                        const lowerFilename = filename.toLowerCase();
                        if (lowerFilename.endsWith(".ini")) return false;
                        if (lowerFilename.endsWith(".db")) return false;
                        if (lowerFilename === "ds_store" || lowerFilename === ".ds_store") return false;
                        // Skip directory entries (JSZip includes them with trailing slash)
                        if (zip.files[key].dir) return false;
                        return true;
                    });
                    console.log("[3D Loader] ZIP Contents (filtered):", fileKeys);
                    
                    const objKey = fileKeys.find((key) => key.toLowerCase().endsWith(".obj"));
                    if (!objKey) {
                        throw new Error("No valid .obj file found inside the ZIP archive.");
                    }
                    const mtlKey = fileKeys.find((key) => key.toLowerCase().endsWith(".mtl"));


                    // Extract all textures and create blob URLs
                    const textureMap: Record<string, string> = {};
                    const localUrls: string[] = [];

                    for (const key of fileKeys) {
                        const lowerKey = key.toLowerCase();
                        if (
                            lowerKey.endsWith(".png") ||
                            lowerKey.endsWith(".jpg") ||
                            lowerKey.endsWith(".jpeg") ||
                            lowerKey.endsWith(".tga")
                        ) {
                            const fileBlob = await zip.files[key].async("blob");
                            let mimeType = "image/jpeg";
                            if (lowerKey.endsWith(".png")) mimeType = "image/png";
                            else if (lowerKey.endsWith(".tga")) mimeType = "image/tga";

                            const typedBlob = new Blob([fileBlob], { type: mimeType });
                            const url = URL.createObjectURL(typedBlob);
                            textureMap[key] = url;
                            localUrls.push(url);
                        }
                    }

                    // Extract OBJ blob URL
                    const objBlob = await zip.files[objKey].async("blob");
                    const objUrl = URL.createObjectURL(new Blob([objBlob], { type: "text/plain" }));
                    localUrls.push(objUrl);

                    // Extract MTL blob URL if present, processing references to avoid missing texture errors
                    let mtlUrl: string | null = null;
                    // Counters hoisted here so they're in scope after the if(mtlKey) block
                    // where allTexturesMissing is computed.
                    let mtlTexRefCount = 0; // total map_* / bump / disp lines seen
                    let mtlMatchCount = 0;  // how many were suffix-matched to a blob URL
                    if (mtlKey) {
                        const mtlText = await zip.files[mtlKey].async("text");
                        const mtlLines = mtlText.split(/\r?\n/);
                        const processedMtlLines = mtlLines.map((line) => {
                            const trimmed = line.trim();
                            if (trimmed.startsWith("#") || !trimmed) return line;

                            const firstSpaceIdx = trimmed.indexOf(" ");
                            if (firstSpaceIdx !== -1) {
                                const keyword = trimmed.slice(0, firstSpaceIdx).trim().toLowerCase();
                                if (
                                    keyword.startsWith("map_") ||
                                    keyword === "bump" ||
                                    keyword === "disp" ||
                                    keyword === "decal"
                                ) {
                                    // ── PASS 1: reverse suffix-match against known texture basenames ──
                                    // This handles filenames WITH spaces (e.g. "Screenshot 2025-11-03 111530.png")
                                    // where a naive lastIndexOf(" ") would only return the last word.
                                    // It also handles MTL loader options before the path ("-o 0 0 0 tex.png")
                                    // because we check whether remainder *ends with* the basename.
                                    const remainder = trimmed.slice(firstSpaceIdx).trim();
                                    const WHITE_FALLBACK = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC";
                                    mtlTexRefCount++;   // count every map_Kd / map_Ks / etc. line seen

                                    let suffixMatchUrl: string | null = null;
                                    let suffixMatchBasename = "";
                                    for (const key of Object.keys(textureMap)) {
                                        const basename = decodeURIComponent(key)
                                            .replace(/\\/g, "/")
                                            .split("/")
                                            .pop() || "";
                                        if (!basename) continue;
                                        if (remainder.toLowerCase().endsWith(basename.toLowerCase())) {
                                            // Verify the character before the basename is a separator
                                            // (space, slash, backslash, or the start of the string)
                                            const offset = remainder.length - basename.length;
                                            if (offset === 0 || /[\s/\\]/.test(remainder[offset - 1])) {
                                                suffixMatchUrl = textureMap[key];
                                                suffixMatchBasename = basename;
                                                break;
                                            }
                                        }
                                    }

                                    if (suffixMatchUrl) {
                                        // Keep any MTL loader option flags that precede the filename
                                        const prefixPart = remainder.slice(0, remainder.length - suffixMatchBasename.length);
                                        console.log(`[3D Loader] MTL suffix-matched texture "${suffixMatchBasename}"`);
                                        mtlMatchCount++;  // successfully resolved a texture reference
                                        return `${trimmed.slice(0, firstSpaceIdx)} ${prefixPart}${suffixMatchUrl}`;
                                    }

                                    // ── PASS 2: fallback quote/space extraction for unmatched paths ──
                                    // At this point no known texture matched. Extract the filename to
                                    // report it and replace the line with a white fallback so the MTL
                                    // blob does not contain a broken absolute/relative file path.
                                    let filenameForWarning = "";
                                    if (remainder.endsWith('"')) {
                                        const q = remainder.lastIndexOf('"', remainder.length - 2);
                                        if (q !== -1) filenameForWarning = remainder.slice(q + 1, -1);
                                    } else if (remainder.endsWith("'")) {
                                        const q = remainder.lastIndexOf("'", remainder.length - 2);
                                        if (q !== -1) filenameForWarning = remainder.slice(q + 1, -1);
                                    } else {
                                        // Best-effort: decode the whole remainder and pop the basename
                                        filenameForWarning = decodeURIComponent(remainder)
                                            .replace(/\\/g, "/")
                                            .split("/")
                                            .pop() || remainder;
                                    }

                                    if (filenameForWarning) {
                                        // BUG 2 FIX: replace broken absolute/relative path with white
                                        // fallback so the browser never tries to fetch a file:// URL.
                                        console.warn(
                                            `[3D Loader] Texture "${filenameForWarning}" referenced in MTL was not found in the ZIP. ` +
                                            `Replacing with white fallback. Check that all texture files are included.`
                                        );
                                        return `${trimmed.slice(0, firstSpaceIdx)} ${WHITE_FALLBACK}`;
                                    }
                                }
                            }
                            return line;
                        });

                        const processedMtlText = processedMtlLines.join("\n");
                        const mtlBlob = new Blob([processedMtlText], { type: "text/plain" });
                        mtlUrl = URL.createObjectURL(mtlBlob);
                        localUrls.push(mtlUrl);
                    }

                    if (isCancelled) {
                        revokeUrls(localUrls);
                        return;
                    }

                    // BUG 1 FIX: detect when an MTL exists but the ZIP had no texture images
                    const texturesMissing = !!mtlKey && Object.keys(textureMap).length === 0;
                    // allTexturesMissing: MTL had texture lines but NONE matched anything in the ZIP.
                    // Happens when the ZIP contains images that don't match the MTL's references
                    // (e.g. user includes a screenshot.png but MTL references Fabric036.png).
                    const allTexturesMissing = !!mtlKey && mtlTexRefCount > 0 && mtlMatchCount === 0;
                    if (texturesMissing || allTexturesMissing) {
                        console.warn(
                            "[3D Loader] MTL file found but ZIP contains no matching texture images. " +
                            `(${mtlMatchCount}/${mtlTexRefCount} MTL texture refs resolved) ` +
                            "Model will render with a fallback grey material."
                        );
                    }

                    activeBlobUrlsRef.current = localUrls;
                    setZipModelData({
                        objBlobUrl: objUrl,
                        mtlBlobUrl: mtlUrl,
                        textureMap,
                        texturesMissing,
                        allTexturesMissing,
                    });
                    setBlobUrl(null);
                    return;
                }

                // If Gzip or standard file
                let finalBytes = bytes;
                if (isGzip && bytes) {
                    finalBytes = await decompressIfGzip(bytes);
                }

                let singleUrl: string;
                if (finalBytes) {
                    const blob = new Blob([finalBytes as any], { type: "text/plain" });
                    singleUrl = URL.createObjectURL(blob);
                } else {
                    // Plain text file or a URL
                    if (dataToProcess.startsWith("http") || dataToProcess.startsWith("blob:")) {
                        singleUrl = dataToProcess;
                    } else {
                        const blob = new Blob([dataToProcess], { type: "text/plain" });
                        singleUrl = URL.createObjectURL(blob);
                    }
                }

                if (isCancelled) {
                    if (singleUrl && !singleUrl.startsWith("http")) URL.revokeObjectURL(singleUrl);
                    return;
                }

                if (singleUrl && !singleUrl.startsWith("http")) {
                    activeBlobUrlsRef.current = [singleUrl];
                }
                setZipModelData(null);
                setBlobUrl(singleUrl);
            } catch (e) {
                console.error("3D Viewer Critical Error: Failed to process model data:", e);
            }
        };

        processModel();

        // Revoke the old URLs after new ones have loaded (giving them a bit of time)
        revokeUrls(prevUrls);

        return () => {
            isCancelled = true;
            revokeUrls(activeBlobUrlsRef.current);
        };
    }, [objData]);

    // Create a stable Timer instance to avoid THREE.Clock deprecation warning
    const timer = useMemo(() => new Timer(), []);

    const hasModelData = zipModelData ? !!zipModelData.objBlobUrl : !!blobUrl;
    const canvasKey = zipModelData ? zipModelData.objBlobUrl : blobUrl || "default";

    if (!hasModelData) {
        return (
            <div className="w-full h-[400px] bg-slate-900/50 rounded-2xl flex items-center justify-center text-slate-500 border border-white/10">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs uppercase tracking-widest opacity-60">Initializing...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-[400px] bg-slate-900/50 rounded-2xl border border-white/10 overflow-hidden relative shadow-inner">
            <Suspense fallback={
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs uppercase tracking-widest opacity-60">Preparing Viewer...</span>
                </div>
            }>
                <Canvas
                    key={canvasKey}
                    onCreated={({ gl }) => {
                        glRef.current = gl;
                    }}
                    shadows={{ type: THREE.PCFShadowMap }}
                    camera={{ position: [0, 0, 5], fov: 45 }}
                    gl={{
                        powerPreference: "high-performance",
                        antialias: false, // Slightly better performance
                        alpha: true,
                        stencil: false,
                        depth: true,
                    }}
                    dpr={[1, 2]} // Limit pixel ratio for performance
                    // Use custom timer to suppress Clock deprecation warning
                    {...{ clock: timer } as any}
                >
                    <Stage intensity={0.8} environment="city" adjustCamera={1.2}>
                        {zipModelData ? (
                            zipModelData.mtlBlobUrl ? (
                                <ZippedModelWithMaterials
                                    objBlobUrl={zipModelData.objBlobUrl}
                                    mtlBlobUrl={zipModelData.mtlBlobUrl}
                                    textureMap={zipModelData.textureMap}
                                    texturesMissing={zipModelData.texturesMissing}
                                    allTexturesMissing={zipModelData.allTexturesMissing}
                                />
                            ) : (
                                <SimpleModel objBlobUrl={zipModelData.objBlobUrl} />
                            )
                        ) : blobUrl ? (
                            <Model blobUrl={blobUrl} />
                        ) : null}
                    </Stage>
                    <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
                </Canvas>
            </Suspense>

            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                    3D Interactive Preview
                </div>
                <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[9px] text-slate-500">
                    Scroll to Zoom • Drag to Rotate
                </div>
            </div>

            {/* BUG 1 FIX: warn the user when textures were absent from the ZIP */}
            {(zipModelData?.texturesMissing || zipModelData?.allTexturesMissing) && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-amber-900/80 backdrop-blur-md border border-amber-500/40 text-amber-300 text-[10px] uppercase tracking-widest font-semibold px-3 py-1.5 rounded-full pointer-events-none">
                    <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    {zipModelData.texturesMissing ? "Textures not included in ZIP" : "Texture files not matching MTL references"}
                </div>
            )}
        </div>
    );
}
