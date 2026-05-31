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
    mtlTexRefCount: number;
    missingTextureNames: string[];
}

// Removed hardcoded texture generators.

function convertToStandardMaterial(phongMat: any): THREE.MeshStandardMaterial {
    const standardMat = new THREE.MeshStandardMaterial({
        name: phongMat.name,
        color: phongMat.color,
        map: phongMat.map,
        lightMap: phongMat.lightMap,
        lightMapIntensity: phongMat.lightMapIntensity,
        aoMap: phongMat.aoMap,
        aoMapIntensity: phongMat.aoMapIntensity,
        emissive: phongMat.emissive,
        emissiveIntensity: phongMat.emissiveIntensity,
        emissiveMap: phongMat.emissiveMap,
        bumpMap: phongMat.bumpMap,
        bumpScale: phongMat.bumpScale,
        normalMap: phongMat.normalMap,
        normalScale: phongMat.normalScale,
        displacementMap: phongMat.displacementMap,
        displacementScale: phongMat.displacementScale,
        displacementBias: phongMat.displacementBias,
        alphaMap: phongMat.alphaMap,
        envMap: phongMat.envMap,
        envMapIntensity: phongMat.envMapIntensity,
        wireframe: phongMat.wireframe,
        wireframeLinewidth: phongMat.wireframeLinewidth,
        flatShading: phongMat.flatShading,
        side: phongMat.side,
        transparent: phongMat.transparent,
        opacity: phongMat.opacity,
        depthFunc: phongMat.depthFunc,
        depthTest: phongMat.depthTest,
        depthWrite: phongMat.depthWrite,
        colorWrite: phongMat.colorWrite,
        stencilWrite: phongMat.stencilWrite,
        stencilWriteMask: phongMat.stencilWriteMask,
        stencilFunc: phongMat.stencilFunc,
        stencilRef: phongMat.stencilRef,
        stencilFuncMask: phongMat.stencilFuncMask,
        stencilFail: phongMat.stencilFail,
        stencilZFail: phongMat.stencilZFail,
        stencilZPass: phongMat.stencilZPass,
        premultipliedAlpha: phongMat.premultipliedAlpha,
        shadowSide: phongMat.shadowSide,
    });

    if (phongMat.precision) standardMat.precision = phongMat.precision;

    // Convert shininess (Ns) typically 0 to 1000 to roughness (0 to 1)
    if (phongMat.shininess !== undefined) {
        standardMat.roughness = Math.min(1, Math.max(0, 1 - (phongMat.shininess / 1000)));
    } else {
        standardMat.roughness = 0.8;
    }

    if (phongMat.specular && (phongMat.specular.r > 0.1 || phongMat.specular.g > 0.1 || phongMat.specular.b > 0.1)) {
        standardMat.metalness = 0.2;
    } else {
        standardMat.metalness = 0.1;
    }

    return standardMat;
}

function useTextureScaleEffect(
    processedObj: THREE.Object3D | null,
    textureScale: number,
    applyToAll: boolean
) {
    useEffect(() => {
        if (!processedObj) return;

        const TILING_KEYWORDS = [
            "fabric", "knit", "weave", "rattan", "pattern", "carpet", "cloth", "wool", 
            "leather", "wood", "stone", "brick", "tile", "tiling", "mesh_fabric", "material_fabric"
        ];

        const texProps = ["map", "normalMap", "roughnessMap", "aoMap", "bumpMap", "metalnessMap", "emissiveMap", "alphaMap"];

        processedObj.traverse((child: any) => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((mat: any) => {
                    const matName = (mat.name || "").toLowerCase();
                    
                    // Determine if this material or its textures contain tiling keywords
                    const isTiling = applyToAll || 
                        TILING_KEYWORDS.some(kw => matName.includes(kw)) ||
                        texProps.some(prop => {
                            const tex = mat[prop];
                            return tex && tex.isTexture && tex.name && TILING_KEYWORDS.some(kw => tex.name.toLowerCase().includes(kw));
                        });

                    const scale = isTiling ? textureScale : 1.0;

                    let hasAnyTexture = false;
                    texProps.forEach((prop) => {
                        if (mat[prop] && mat[prop].isTexture) {
                            hasAnyTexture = true;
                            const tex = mat[prop];
                            tex.wrapS = THREE.RepeatWrapping;
                            tex.wrapT = THREE.RepeatWrapping;
                            tex.repeat.set(scale, scale);
                            tex.needsUpdate = true;
                        }
                    });

                    if (hasAnyTexture) {
                        mat.needsUpdate = true;
                    }
                });
            }
        });
    }, [processedObj, textureScale, applyToAll]);
}

function postProcessObject(
    object: THREE.Object3D,
    applyFallbackMaterial = false,
    textureMap: Record<string, string> | null = null
) {
    // Diagnostic logic for dispersed geometry (e.g. Blender transforms not applied)
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const center = box.getCenter(new THREE.Vector3());
    if (maxDim > 50 || Math.abs(center.x) > 20 || Math.abs(center.y) > 20) {
        console.warn(
            "[3D Loader] Model geometry is widely dispersed (size:",
            size, "center:", center,
            "). Re-export from Blender with Object > Apply > All Transforms."
        );
    }

    // Pre-create a shared fallback material so models without textures
    // render as neutral grey instead of broken-looking bright white.
    const fallbackMat = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.1
    });

    const texLoader = new THREE.TextureLoader();

    // Build basenameToUrl for auto-injection
    const basenameToUrl: Record<string, string> = {};
    if (textureMap) {
        for (const [key, url] of Object.entries(textureMap)) {
            const basename = decodeURIComponent(key)
                .replace(/\\/g, "/")
                .split("/")
                .pop()
                ?.toLowerCase() || "";
            if (basename) basenameToUrl[basename] = url;
        }
    }

    object.traverse((child: any) => {
        if (child.isMesh) {
            if (child.geometry) {
                // Compute normals to prevent shader NaN crashes with lighting
                child.geometry.computeVertexNormals();
                // Recompute bounds to ensure Stage and raycasters don't fail
                child.geometry.computeBoundingSphere();
                child.geometry.computeBoundingBox();
            }

            if (child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                const processedMaterials = materials.map((originalMat: any) => {
                    let mat = originalMat;
                    
                    // Convert MeshPhongMaterial to MeshStandardMaterial to support full PBR maps
                    if (mat.isMeshPhongMaterial || mat.type === "MeshPhongMaterial") {
                        mat = convertToStandardMaterial(mat);
                    }

                    // Perform auto-injection of textures from ZIP if textureMap is available
                    let injectedAny = false;
                    if (Object.keys(basenameToUrl).length > 0) {
                        const propRoles: Array<{ prop: string; keywords: string[] }> = [
                            { prop: "map", keywords: ["basecolor", "base_color", "diffuse", "albedo", "_col", "_color", "_diff", "color"] },
                            { prop: "aoMap", keywords: ["ambientocclusion", "occlusion", "_ao", "ambient"] },
                            { prop: "specularMap", keywords: ["specular", "_spec", "spec"] },
                            { prop: "roughnessMap", keywords: ["roughness", "glossiness", "_rough", "_gloss", "_rgh", "rough"] },
                            { prop: "metalnessMap", keywords: ["metallic", "metalness", "metal", "_metal", "_met"] },
                            { prop: "normalMap", keywords: ["normal", "normalmap", "_nrm", "_nor", "_normal"] },
                            { prop: "bumpMap", keywords: ["bump", "height", "displacement", "disp", "_height", "_h"] },
                            { prop: "alphaMap", keywords: ["opacity", "alpha", "transparency", "_opa", "_alpha"] },
                            { prop: "emissiveMap", keywords: ["emission", "emissive", "_emit", "_emissive"] }
                        ];

                        const ALL_MAP_KEYWORDS = [
                            "basecolor", "base_color", "diffuse", "albedo", "_col", "_color", "_diff", "color",
                            "ambientocclusion", "occlusion", "_ao", "ambient", "ao",
                            "specular", "_spec", "spec",
                            "roughness", "glossiness", "_rough", "_gloss", "_rgh", "rough",
                            "metallic", "metalness", "metal", "_metal", "_met",
                            "normalmap", "_nrm", "_nor", "_normal", "normal",
                            "bump",
                            "opacity", "alpha", "transparency", "_opa", "_alpha",
                            "height", "displacement", "disp", "_height", "_h",
                            "emissive", "emission", "_emit", "_emissive"
                        ];

                        const getMaterialPrefix = (filename: string): string => {
                            let name = filename.toLowerCase();
                            const lastDot = name.lastIndexOf(".");
                            if (lastDot !== -1) {
                                name = name.slice(0, lastDot);
                            }
                            ALL_MAP_KEYWORDS.forEach((kw) => {
                                name = name.replace(kw, "");
                            });
                            name = name.replace(/_2k$|_4k$|_1k$|_8k$/g, "");
                            name = name.replace(/(^[\s-_]+|[\s-_]+$)/g, "");
                            return name.replace(/[\s-_]+/g, "");
                        };

                        const matName = mat.name || "";
                        const matNameLower = matName.toLowerCase().replace(/[\s-_]+/g, "");

                        propRoles.forEach(({ prop, keywords }) => {
                            // Check if a real texture is already assigned
                            const existingTex = mat[prop] as THREE.Texture | null | undefined;
                            const isRealTexture = existingTex &&
                                existingTex.image &&
                                (existingTex.image as HTMLImageElement).width > 1 &&
                                (existingTex.image as HTMLImageElement).height > 1;
                            if (isRealTexture) return;

                            // Priority 1: Exact material prefix match (e.g. Knit_Fabric_basecolor -> Knit_Fabric)
                            let matchedKey = Object.keys(basenameToUrl).find((filename) => {
                                const prefix = getMaterialPrefix(filename);
                                const fnLower = filename.toLowerCase().replace(/[\s-_]+/g, "");
                                const isRole = keywords.some((kw) => fnLower.includes(kw));
                                return isRole && prefix === matNameLower;
                            });

                            // Priority 2: Generic texture file match (e.g. no material prefix like "basecolor.png")
                            if (!matchedKey) {
                                matchedKey = Object.keys(basenameToUrl).find((filename) => {
                                    const prefix = getMaterialPrefix(filename);
                                    const fnLower = filename.toLowerCase().replace(/[\s-_]+/g, "");
                                    const isRole = keywords.some((kw) => fnLower.includes(kw));
                                    const isGenericPrefix = !prefix || ["texture", "material", "default", "unnamed"].includes(prefix);
                                    return isRole && isGenericPrefix;
                                });
                            }

                            if (matchedKey) {
                                const blobUrl = basenameToUrl[matchedKey];
                                console.log(`[3D Loader] Auto-injected unreferenced texture "${matchedKey}" → material "${matName}.${prop}"`);
                                const tex = texLoader.load(blobUrl);
                                tex.name = matchedKey; // Store original filename for tiling detection
                                if (prop === "map") tex.colorSpace = THREE.SRGBColorSpace;
                                mat[prop] = tex;
                                if (prop === "alphaMap" || prop === "map" && matchedKey.toLowerCase().includes("opacity")) {
                                    mat.transparent = true;
                                    mat.opacity = 1.0;
                                }
                                if (prop === "normalMap") {
                                    mat.normalScale = new THREE.Vector2(1.5, 1.5);
                                }
                                mat.needsUpdate = true;
                                injectedAny = true;
                            }
                        });
                    }

                    // Convert bumpMap to normalMap if the texture name contains normal keywords
                    if (mat.bumpMap && mat.bumpMap.isTexture) {
                        const texName = (mat.bumpMap.name || "").toLowerCase();
                        if (texName.includes("normal") || texName.includes("nrm") || texName.includes("nor")) {
                            mat.normalMap = mat.bumpMap;
                            mat.bumpMap = null;
                            mat.normalScale = new THREE.Vector2(1.5, 1.5);
                        }
                    }

                    // Procedural color enhancements for materials that are missing diffuse textures
                    if (!mat.map) {
                        const mName = (mat.name || "").toLowerCase();
                        if (mName === "woven_rattan_pattern.002" || mName === "woven_rattan_pattern.001") {
                            // Dark brown/black rattan legs/base
                            mat.color.setRGB(0.18, 0.15, 0.13);
                            mat.roughness = 0.85;
                            mat.metalness = 0.05;
                        } else if (mName === "woven_rattan_pattern") {
                            // Cream/beige rattan seat/tabletop
                            mat.color.setRGB(0.87, 0.80, 0.70);
                            mat.roughness = 0.75;
                            mat.metalness = 0.05;
                        } else if (mName === "light_iron") {
                            // Dark charcoal metal legs
                            mat.color.setRGB(0.13, 0.13, 0.13);
                            mat.roughness = 0.45;
                            mat.metalness = 0.85;
                        } else if (mName === "fabric") {
                            // Cream seat cushion
                            mat.color.setRGB(0.90, 0.87, 0.84);
                            mat.roughness = 0.95;
                            mat.metalness = 0.0;
                        } else if (mName === "fabric.001") {
                            // Soft blue cushion/pillow
                            mat.color.setRGB(0.56, 0.66, 0.75);
                            mat.roughness = 0.90;
                            mat.metalness = 0.0;
                        }
                    }

                    // Apply fallback grey material only if fallback is requested and we did not inject any textures
                    // and also didn't apply procedural color mapping
                    const hasProceduralColor = ["woven_rattan_pattern.002", "woven_rattan_pattern.001", "woven_rattan_pattern", "light_iron", "fabric", "fabric.001"].includes((mat.name || "").toLowerCase());
                    if (applyFallbackMaterial && !injectedAny && !hasProceduralColor) {
                        return fallbackMat;
                    }

                    // Common material settings
                    mat.side = THREE.DoubleSide;
                    mat.precision = 'mediump';
                    if (mat.opacity < 1.0) {
                        mat.transparent = true;
                    }
                    if (mat.map) {
                        mat.map.colorSpace = THREE.SRGBColorSpace;
                    }
                    if (mat.normalMap) {
                        mat.normalScale = new THREE.Vector2(1.5, 1.5);
                    }
                    if (mat.emissiveMap) {
                        mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
                    }
                    if (mat.specularMap) {
                        mat.specularMap.colorSpace = THREE.SRGBColorSpace;
                    }
                    if (mat.emissive && (mat.emissive.r > 0 || mat.emissive.g > 0 || mat.emissive.b > 0)) {
                        mat.emissiveIntensity = 3.0;
                        mat.toneMapped = false;
                    }
                    mat.needsUpdate = true;
                    return mat;
                });

                child.material = Array.isArray(child.material) ? processedMaterials : processedMaterials[0];
            }
        }
    });
}

function Model({ blobUrl, textureScale, applyToAll }: { blobUrl: string; textureScale: number; applyToAll: boolean }) {
    // useLoader handles caching and Suspense automatically
    const obj = useLoader(OBJLoader as any, blobUrl);

    const processedObj = useMemo(() => {
        if (!obj) return null;

        // Clone to avoid mutating cached suspense object
        const clone = obj.clone(true);
        postProcessObject(clone);
        return clone;
    }, [obj]);

    useTextureScaleEffect(processedObj, textureScale, applyToAll);

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
    textureScale,
    applyToAll,
}: {
    objBlobUrl: string;
    mtlBlobUrl: string;
    textureMap: Record<string, string>;
    texturesMissing: boolean;
    allTexturesMissing: boolean;
    textureScale: number;
    applyToAll: boolean;
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
        manager.setURLModifier((url) => {
            if (url.startsWith("blob:") && url.includes("blob:http")) {
                const parts = url.split("blob:http");
                const lastPart = parts[parts.length - 1];
                return "blob:http" + lastPart;
            }
            return url;
        });
        loader.manager = manager;
        loader.setResourcePath("");
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
                const existingTex = (mat as any)[matProp] as THREE.Texture | null | undefined;
                // Skip if Three.js already loaded a real (non-trivial) texture for this slot.
                // A 1×1 texture indicates a white fallback was substituted during MTL preprocessing;
                // in that case we should still try to inject the proper texture from the ZIP.
                const isRealTexture = existingTex &&
                    existingTex.image &&
                    (existingTex.image as HTMLImageElement).width > 1 &&
                    (existingTex.image as HTMLImageElement).height > 1;
                if (isRealTexture) return;

                const storedPath: string = info[infoKey] || "";
                if (!storedPath) return;

                // Extract the basename from whatever path MTL stored
                const basename = decodeURIComponent(storedPath)
                    .replace(/\\/g, "/")
                    .split("/")
                    .pop()
                    ?.toLowerCase() || "";

                let targetProp = matProp;
                // Route normal maps to normalMap instead of bumpMap
                if ((infoKey === "map_bump" || infoKey === "bump") && (basename.includes("normal") || basename.includes("nrm") || basename.includes("nor"))) {
                    targetProp = "normalMap";
                }

                let blobUrl = basenameToUrl[basename];
                if (!blobUrl) {
                    // Try extensionless match
                    const baseLastDot = basename.lastIndexOf(".");
                    const baseNoExt = baseLastDot !== -1 ? basename.slice(0, baseLastDot) : basename;
                    
                    const matchedKey = Object.keys(basenameToUrl).find((k) => {
                        const kLastDot = k.lastIndexOf(".");
                        const kNoExt = kLastDot !== -1 ? k.slice(0, kLastDot) : k;
                        return kNoExt === baseNoExt;
                    });
                    if (matchedKey) {
                        blobUrl = basenameToUrl[matchedKey];
                    }
                }
                // Role-based fallback: if still no match, infer texture purpose from map key
                // e.g. if mat.map is missing and infoKey=map_kd, look for *basecolor* file
                if (!blobUrl) {
                    const ROLE_KEYWORDS: Record<string, string[]> = {
                        "map_kd":   ["basecolor", "base_color", "diffuse", "albedo", "_col", "_color", "_diff"],
                        "map_ka":   ["ambientocclusion", "occlusion", "_ao", "ambient"],
                        "map_ks":   ["specular", "metallic", "_spec", "_metal", "_met"],
                        "map_ns":   ["roughness", "glossiness", "_rough", "_gloss", "_rgh"],
                        "map_bump": ["normal", "_nrm", "_nor", "_normal"],
                        "bump":     ["normal", "_nrm", "_nor", "_normal", "bump", "height"],
                        "map_d":    ["opacity", "alpha", "_opa", "_alpha"],
                        "disp":     ["height", "displacement", "_height"],
                        "map_ke":   ["emission", "emissive", "_emit"],
                    };
                    const roleWords = ROLE_KEYWORDS[infoKey] ?? [];
                    if (roleWords.length > 0) {
                        const roleMatch = Object.keys(basenameToUrl).find((k) =>
                            roleWords.some((w) => k.toLowerCase().includes(w))
                        );
                        if (roleMatch) {
                            blobUrl = basenameToUrl[roleMatch];
                            console.log(`[3D Loader] Injection role-matched "${infoKey}" → "${roleMatch}"`);
                        }
                    }
                }
                if (!blobUrl) return;

                console.log(`[3D Loader] Injecting texture "${basename}" → material "${matName}.${targetProp}"`);
                const tex = texLoader.load(blobUrl);
                tex.name = basename; // Store original filename for tiling detection
                // Diffuse maps need SRGBColorSpace for correct colour rendering
                if (targetProp === "map") tex.colorSpace = THREE.SRGBColorSpace;
                (mat as any)[targetProp] = tex;
                if (targetProp === "normalMap") {
                    mat.normalScale = new THREE.Vector2(1.5, 1.5);
                }
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
        postProcessObject(clone, texturesMissing || allTexturesMissing, textureMap);
        return clone;
    }, [obj, texturesMissing, allTexturesMissing, textureMap]);

    useTextureScaleEffect(processedObj, textureScale, applyToAll);

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

function SimpleModel({ objBlobUrl, textureScale, applyToAll }: { objBlobUrl: string; textureScale: number; applyToAll: boolean }) {
    const obj = useLoader(OBJLoader as any, objBlobUrl);

    const processedObj = useMemo(() => {
        if (!obj) return null;
        const clone = obj.clone(true);
        postProcessObject(clone);
        return clone;
    }, [obj]);

    useTextureScaleEffect(processedObj, textureScale, applyToAll);

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

    // Decode URL-encoded base64 characters
    if (cleanStr.includes("%")) {
        cleanStr = cleanStr.replace(/%2B/gi, "+").replace(/%2F/gi, "/").replace(/%3D/gi, "=");
    }

    // Map URL-safe characters and remove invalid characters
    const clean = cleanStr
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .replace(/[^A-Za-z0-9+/=]/g, "");

    // Native decode using atob (extremely fast)
    try {
        const binaryString = atob(clean);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    } catch (e) {
        console.warn("Fallback to manual base64 decoding due to error:", e);
    }

    // Fallback: original manual decoder
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
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
    const [textureScale, setTextureScale] = useState<number>(8);
    const [applyToAll, setApplyToAll] = useState<boolean>(false);
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
                    const filesMap: Record<string, Uint8Array> = {};

                    const extractZipRecursively = async (z: JSZip, currentPrefix = "") => {
                        const keys = Object.keys(z.files);
                        for (const key of keys) {
                            if (z.files[key].dir) continue;
                            if (key.includes("__MACOSX")) continue;
                            const filename = key.split(/[/\\]/).pop() || "";
                            if (filename.startsWith(".")) continue;
                            
                            const lowerFilename = filename.toLowerCase();
                            if (lowerFilename.endsWith(".ini") || lowerFilename.endsWith(".db")) continue;
                            if (lowerFilename === "ds_store" || lowerFilename === ".ds_store") continue;
                            // Skip Windows system metadata files even without extension
                            if (lowerFilename === "desktop" || lowerFilename === "thumbs" || lowerFilename === "thumbs.db") continue;
                            // Skip files with no extension that are not 3D-related —
                            // e.g. Windows desktop.ini saved without ".ini" by some zip tools
                            const hasKnown3DExt = /\.(obj|mtl|png|jpg|jpeg|tga|webp|bmp|zip|gzip|gz)$/i.test(filename);
                            const hasAnyExt = filename.includes(".");
                            if (!hasAnyExt && !hasKnown3DExt) continue;

                            const content = await z.files[key].async("uint8array");
                            const virtualKey = currentPrefix ? `${currentPrefix}/${key}` : key;
                            
                            if (lowerFilename.endsWith(".zip")) {
                                try {
                                    console.log(`[3D Loader] Unpacking nested ZIP: ${virtualKey}`);
                                    const subZip = await JSZip.loadAsync(content);
                                    await extractZipRecursively(subZip, virtualKey);
                                } catch (e) {
                                    console.error(`Failed to unpack nested zip ${virtualKey}:`, e);
                                    filesMap[virtualKey] = content;
                                }
                            } else {
                                filesMap[virtualKey] = content;
                            }
                        }
                    };

                    const outerZip = await JSZip.loadAsync(bytes);
                    await extractZipRecursively(outerZip);

                    const fileKeys = Object.keys(filesMap);
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
                            lowerKey.endsWith(".tga") ||
                            lowerKey.endsWith(".webp") ||
                            lowerKey.endsWith(".bmp")
                        ) {
                            const content = filesMap[key];
                            let mimeType = "image/jpeg";
                            if (lowerKey.endsWith(".png")) mimeType = "image/png";
                            else if (lowerKey.endsWith(".tga")) mimeType = "image/tga";
                            else if (lowerKey.endsWith(".webp")) mimeType = "image/webp";
                            else if (lowerKey.endsWith(".bmp")) mimeType = "image/bmp";

                            const typedBlob = new Blob([content as any], { type: mimeType });
                            const url = URL.createObjectURL(typedBlob);
                            textureMap[key] = url;
                            localUrls.push(url);
                        }
                    }

                    // Extract OBJ blob URL
                    const objContent = filesMap[objKey];
                    const objUrl = URL.createObjectURL(new Blob([objContent as any], { type: "text/plain" }));
                    localUrls.push(objUrl);

                    // Extract MTL blob URL if present, processing references to avoid missing texture errors
                    let mtlUrl: string | null = null;
                    // Counters hoisted here so they're in scope after the if(mtlKey) block
                    // where allTexturesMissing is computed.
                    let mtlTexRefCount = 0; // total map_* / bump / disp lines seen
                    let mtlMatchCount = 0;  // how many were suffix-matched to a blob URL
                    const missingTextureNames: string[] = [];
                    if (mtlKey) {
                        const WHITE_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC";
                        const whitePngBytes = Uint8Array.from(atob(WHITE_PNG_BASE64), c => c.charCodeAt(0));
                        const whitePngBlob = new Blob([whitePngBytes], { type: "image/png" });
                        const WHITE_FALLBACK_BLOB_URL = URL.createObjectURL(whitePngBlob);
                        localUrls.push(WHITE_FALLBACK_BLOB_URL);

                        const mtlBytes = filesMap[mtlKey];
                        const mtlText = new TextDecoder("utf-8").decode(mtlBytes);
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

                                    // ── PASS 1.5: match by basename without extension ──
                                    if (!suffixMatchUrl) {
                                        const remainderFilename = remainder.split(/[/\\]/).pop() || remainder;
                                        const remainderLastDot = remainderFilename.lastIndexOf(".");
                                        const remainderNoExt = remainderLastDot !== -1 ? remainderFilename.slice(0, remainderLastDot).toLowerCase() : remainderFilename.toLowerCase();

                                        for (const key of Object.keys(textureMap)) {
                                            const basename = decodeURIComponent(key)
                                                .replace(/\\/g, "/")
                                                .split("/")
                                                .pop() || "";
                                            if (!basename) continue;
                                            
                                            const baseLastDot = basename.lastIndexOf(".");
                                            const baseNoExt = baseLastDot !== -1 ? basename.slice(0, baseLastDot).toLowerCase() : basename.toLowerCase();
                                            
                                            if (remainderNoExt === baseNoExt) {
                                                suffixMatchUrl = textureMap[key];
                                                suffixMatchBasename = basename;
                                                break;
                                            }
                                        }
                                    }

                                    // ── PASS 2: semantic role-based matching ──
                                    // When basename/extensionless matching both fail, infer the
                                    // texture's purpose from the MTL keyword and look for any
                                    // ZIP texture whose filename contains matching role keywords.
                                    // e.g. MTL: "map_Kd Fabric036_2K_Color.png" → finds "Knit_Fabric_basecolor.jpg"
                                    if (!suffixMatchUrl) {
                                        const ROLE_KEYWORDS: Record<string, string[]> = {
                                            "map_kd":   ["basecolor", "base_color", "diffuse", "albedo", "_col", "_color", "_diff"],
                                            "map_ka":   ["ambientocclusion", "occlusion", "_ao", "ambient"],
                                            "map_ks":   ["specular", "metallic", "_spec", "_metal", "_met"],
                                            "map_ns":   ["roughness", "glossiness", "_rough", "_gloss", "_rgh"],
                                            "map_bump": ["normal", "normalmap", "_nrm", "_nor", "_normal"],
                                            "bump":     ["normal", "normalmap", "_nrm", "_nor", "_normal", "bump", "height"],
                                            "map_d":    ["opacity", "alpha", "transparency", "_opa", "_alpha"],
                                            "disp":     ["height", "displacement", "disp", "_height", "_h"],
                                            "map_ke":   ["emission", "emissive", "_emit", "_emissive"],
                                            "decal":    ["decal"],
                                        };
                                        const roleWords = ROLE_KEYWORDS[keyword] ?? [];
                                        if (roleWords.length > 0) {
                                            for (const key of Object.keys(textureMap)) {
                                                const bn = decodeURIComponent(key)
                                                    .replace(/\\/g, "/")
                                                    .split("/")
                                                    .pop() || "";
                                                if (!bn) continue;
                                                const bnLower = bn.toLowerCase();
                                                if (roleWords.some(w => bnLower.includes(w))) {
                                                    suffixMatchUrl = textureMap[key];
                                                    suffixMatchBasename = bn;
                                                    console.log(`[3D Loader] MTL role-matched "${keyword}" → "${bn}"`);
                                                    break;
                                                }
                                            }
                                        }
                                    }

                                    if (suffixMatchUrl) {
                                        console.log(`[3D Loader] MTL suffix-matched texture "${suffixMatchBasename}"`);
                                        mtlMatchCount++;  // successfully resolved a texture reference
                                        return `${trimmed.slice(0, firstSpaceIdx)} ${suffixMatchUrl}`;
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
                                        missingTextureNames.push(filenameForWarning);
                                        return `${trimmed.slice(0, firstSpaceIdx)} ${WHITE_FALLBACK_BLOB_URL}`;
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
                    // ONLY flag when MTL actually had map_ lines that couldn't be resolved:
                    const texturesMissing = !!mtlKey && mtlTexRefCount > 0 && Object.keys(textureMap).length === 0;
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
                        mtlTexRefCount,
                        missingTextureNames,
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
                                    textureScale={textureScale}
                                    applyToAll={applyToAll}
                                />
                            ) : (
                                <SimpleModel 
                                    objBlobUrl={zipModelData.objBlobUrl} 
                                    textureScale={textureScale}
                                    applyToAll={applyToAll}
                                />
                            )
                        ) : blobUrl ? (
                            <Model 
                                blobUrl={blobUrl} 
                                textureScale={textureScale}
                                applyToAll={applyToAll}
                            />
                        ) : null}
                    </Stage>
                    <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
                </Canvas>
            </Suspense>

            {/* Texture Tiling Controls */}
            <div className="absolute top-4 right-4 bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col gap-2 pointer-events-auto max-w-[200px] transition-all duration-300 shadow-xl z-10">
                <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1.5">
                    <span className="text-[10px] text-white font-bold uppercase tracking-widest flex items-center gap-1 select-none">
                        <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Texture Tiling
                    </span>
                    <button 
                        onClick={() => {
                            setTextureScale(8);
                            setApplyToAll(false);
                        }}
                        className="text-[9px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer uppercase transition-colors"
                    >
                        Reset
                    </button>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium select-none">
                        <span>Scale: {textureScale}x</span>
                    </div>
                    <input 
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        value={textureScale}
                        onChange={(e) => setTextureScale(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-[9px] text-slate-400 hover:text-slate-300 font-medium mt-0.5 select-none">
                    <input 
                        type="checkbox"
                        checked={applyToAll}
                        onChange={(e) => setApplyToAll(e.target.checked)}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900 w-3.5 h-3.5"
                    />
                    <span>Tile all materials</span>
                </label>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                    3D Interactive Preview
                </div>
                <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[9px] text-slate-500">
                    Scroll to Zoom • Drag to Rotate
                </div>
            </div>

            {/* BUG 1 & 2 FIX: warn the user when textures are absent or not matching */}
            {(zipModelData?.texturesMissing || zipModelData?.allTexturesMissing) && zipModelData.mtlTexRefCount > 0 && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 bg-amber-900/90 backdrop-blur-md border border-amber-500/40 text-amber-300 text-[10px] uppercase tracking-widest font-semibold px-4 py-2.5 rounded-xl pointer-events-none text-center max-w-[90%] shadow-lg">
                    <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 shrink-0 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <span>{zipModelData.texturesMissing ? "Textures not included in ZIP" : "Textures not matching MTL"}</span>
                    </div>
                    {zipModelData.allTexturesMissing && zipModelData.missingTextureNames.length > 0 && (
                        <div className="font-mono text-[9px] text-amber-400 opacity-90 normal-case">
                            Missing: {zipModelData.missingTextureNames.slice(0, 3).join(", ")}
                            {zipModelData.missingTextureNames.length > 3 && 
                                ` +${zipModelData.missingTextureNames.length - 3} more`}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
