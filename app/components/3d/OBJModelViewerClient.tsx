"use client";
import React, { Suspense, useMemo, useEffect, useState, useRef } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage, Center, Environment } from "@react-three/drei";
import { toast } from "sonner";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { TGALoader } from "three/addons/loaders/TGALoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
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

const cleanForFuzzyComparison = (str: string): string => {
    return str
        .toLowerCase()
        .replace(/[^a-z]/g, ""); // Remove all digits, dots, spaces, underscores, dashes, leaving only alphabetic chars
};

const getUrlLastPart = (url: string): string => {
    if (!url) return "";
    return url.replace(/\\/g, "/").split("/").pop()?.toLowerCase() || "";
};

const isTextureCompatibleWithMaterial = (filename: string, materialName: string): boolean => {
    if (!materialName) return true;

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
    const prefix = name.replace(/[\s-_]+/g, "");

    const isGenericPrefix = !prefix || ["texture", "material", "default", "unnamed"].includes(prefix);
    if (isGenericPrefix) {
        return true;
    }

    const prefixClean = cleanForFuzzyComparison(prefix);
    const matNameClean = cleanForFuzzyComparison(materialName.toLowerCase());

    return prefixClean === matNameClean ||
        (prefixClean.length >= 3 && matNameClean.includes(prefixClean)) ||
        (matNameClean.length >= 3 && prefixClean.includes(matNameClean));
};

function applyGenericPBRFallback(mat: any): boolean {
    const name = (mat.name || "").toLowerCase();
    let matched = false;

    if (name.includes("rattan") || name.includes("weave") || name.includes("woven") || name.includes("bamboo")) {
        matched = true;
        if (name.includes("dark") || name.includes(".001") || name.includes(".002") || name.includes(".003") || name.includes("base") || name.includes("leg")) {
            mat.color.setRGB(0.72, 0.60, 0.44); // Darker rattan/wood
        } else {
            mat.color.setRGB(0.82, 0.70, 0.52); // Warm sandy rattan
        }
        mat.roughness = 0.88;
        mat.metalness = 0.0;
    } else if (name.includes("fabric") || name.includes("cloth") || name.includes("knit") || name.includes("wool") || name.includes("cushion") || name.includes("cotton")) {
        matched = true;
        if (name.includes(".001") || name.includes("yellow") || name.includes("gold") || name.includes("accent")) {
            mat.color.setRGB(0.88, 0.72, 0.40); // Yellow/gold accent fabric
        } else if (name.includes("blue") || name.includes("seat") || name.includes("fabric")) {
            if (name.includes("fabric.001")) {
                mat.color.setRGB(0.88, 0.72, 0.40);
            } else {
                mat.color.setRGB(0.75, 0.80, 0.88);
            }
        } else {
            mat.color.setRGB(0.85, 0.83, 0.80); // Neutral off-white fabric
        }
        mat.roughness = 0.95;
        mat.metalness = 0.0;
    } else if (name.includes("gold") || name.includes("brass")) {
        matched = true;
        mat.color.setRGB(0.85, 0.65, 0.25);
        mat.metalness = 0.9;
        mat.roughness = 0.25;
    } else if (name.includes("copper") || name.includes("bronze")) {
        matched = true;
        mat.color.setRGB(0.72, 0.45, 0.30);
        mat.metalness = 0.9;
        mat.roughness = 0.3;
    } else if (name.includes("chrome") || name.includes("silver") || name.includes("steel")) {
        matched = true;
        mat.color.setRGB(0.85, 0.85, 0.85);
        mat.metalness = 0.95;
        mat.roughness = 0.15;
    } else if (name.includes("iron") || name.includes("metal") || name.includes("metallic")) {
        matched = true;
        if (name.includes("light")) {
            mat.color.setRGB(0.20, 0.18, 0.16);
            mat.roughness = 0.50;
            mat.metalness = 0.77;
        } else {
            mat.color.setRGB(0.25, 0.25, 0.25);
            mat.roughness = 0.4;
            mat.metalness = 0.8;
        }
    } else if (name.includes("wood") || name.includes("timber") || name.includes("oak") || name.includes("walnut") || name.includes("mahogany")) {
        matched = true;
        mat.color.setRGB(0.55, 0.38, 0.22); // Warm brown wood
        mat.roughness = 0.75;
        mat.metalness = 0.0;
    } else if (name.includes("plastic") || name.includes("gloss")) {
        matched = true;
        mat.roughness = 0.2;
        mat.metalness = 0.0;
    }

    return matched;
}

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

    // map_Ns in MTL → specularMap in MeshPhongMaterial → roughnessMap in MeshStandardMaterial
    // This is the PBR-equivalent conversion since Ns (specular exponent) maps to roughness.
    if (phongMat.specularMap && phongMat.specularMap.isTexture) {
        const roughTex = phongMat.specularMap;
        roughTex.colorSpace = THREE.LinearSRGBColorSpace;
        standardMat.roughnessMap = roughTex;
        standardMat.needsUpdate = true;
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
            // Enable casting and receiving shadows to give realistic depth and contact shadows!
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.geometry) {
                // Ensure tangents are calculated if normal maps exist and all required attributes are present
                if (child.material && (child.material.normalMap || textureMap)) {
                    const geom = child.geometry;
                    if (geom.index && geom.attributes.position && geom.attributes.normal && geom.attributes.uv) {
                        try { geom.computeTangents(); } catch (e) {}
                    }
                }
                // Only compute normals if they are missing, to preserve custom smooth normals exported from Blender
                if (!child.geometry.attributes.normal) {
                    child.geometry.computeVertexNormals();
                }
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

                            // Priority 1: Exact/Fuzzy material prefix match (e.g. Fabric036_2K_Normal -> Fabric.001)
                            let matchedKey = Object.keys(basenameToUrl).find((filename) => {
                                const prefix = getMaterialPrefix(filename);
                                const fnLower = filename.toLowerCase().replace(/[\s-_]+/g, "");
                                const isRole = keywords.some((kw) => fnLower.includes(kw));

                                const prefixClean = cleanForFuzzyComparison(prefix);
                                const matNameClean = cleanForFuzzyComparison(matNameLower);
                                const isMatch = prefixClean === matNameClean ||
                                    (prefixClean.length >= 3 && matNameClean.includes(prefixClean)) ||
                                    (matNameClean.length >= 3 && prefixClean.includes(matNameClean));
                                return isRole && isMatch;
                            });

                            // Priority 2: Generic texture file match (e.g. no material prefix like "basecolor.png")
                            if (!matchedKey) {
                                matchedKey = Object.keys(basenameToUrl).find((filename) => {
                                    const prefix = getMaterialPrefix(filename);
                                    const fnLower = filename.toLowerCase().replace(/[\s-_]+/g, "");
                                    const isRole = keywords.some((kw) => fnLower.includes(kw));
                                    const isGenericPrefix = !prefix || ["texture", "material", "default", "unnamed"].includes(prefix);
                                    return isRole && isGenericPrefix && isTextureCompatibleWithMaterial(filename, matName);
                                });
                            }

                            if (matchedKey) {
                                // Guard: skip assigning packed textures (ao, roughness, normal, etc) to alphaMap
                                if (prop === "alphaMap") {
                                    const fnLower = matchedKey.toLowerCase();
                                    if (fnLower.includes("ao") || fnLower.includes("rough") || fnLower.includes("height") || fnLower.includes("normal") || fnLower.includes("bump")) {
                                        return;
                                    }
                                }
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
                    // Apply generic PBR color/specular properties based on common material name keywords
                    let hasProceduralColor = false;
                    if (!mat.map) {
                        hasProceduralColor = applyGenericPBRFallback(mat);
                    }

                    // Apply fallback grey material only if fallback is requested and we did not inject any textures
                    // and also didn't apply procedural color mapping
                    if (applyFallbackMaterial && !injectedAny && !hasProceduralColor) {
                        return fallbackMat;
                    }

                    // Common material settings
                    mat.side = THREE.DoubleSide;
                    mat.flatShading = false; // Force smooth shading to fix lighting seams
                    mat.precision = 'highp'; // Force high-precision fragment shaders

                    // Force all maps to use UV channel 0 (uv) and set high-quality mipmapping filters
                    const texProps = ["map", "normalMap", "roughnessMap", "aoMap", "bumpMap", "metalnessMap", "emissiveMap", "alphaMap", "specularMap"];
                    texProps.forEach((prop) => {
                        const tex = mat[prop];
                        if (tex && tex.isTexture) {
                            tex.minFilter = THREE.LinearMipmapLinearFilter;
                            tex.magFilter = THREE.LinearFilter;
                            tex.generateMipmaps = true;

                            if (prop === "map" || prop === "emissiveMap" || prop === "specularMap") {
                                tex.colorSpace = THREE.SRGBColorSpace;
                            } else {
                                tex.colorSpace = THREE.NoColorSpace; // Keeps vectors/data linear
                            }

                            if (tex.channel !== 0) {
                                console.log(`[3D Loader] Forcing texture "${tex.name || prop}" channel from ${tex.channel} to 0`);
                                tex.channel = 0;
                            }
                            tex.needsUpdate = true;
                        }
                    });

                    if (mat.opacity < 1.0) {
                        mat.transparent = true;
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
            <primitive object={processedObj} dispose={null} />
        </Center>
    );
}

function GLTFModel({ blobUrl, textureScale, applyToAll }: { blobUrl: string; textureScale: number; applyToAll: boolean }) {
    // useLoader automatically caches the GLTF layout efficiently
    const gltf = useLoader(GLTFLoader as any, blobUrl, (loader: any) => {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
        loader.setDRACOLoader(dracoLoader);
    });

    // Run post-processing safely directly on the scene object inside an effect
    useEffect(() => {
        if (gltf && gltf.scene) {
            postProcessObject(gltf.scene);
        }
    }, [gltf]);

    useTextureScaleEffect(gltf?.scene || null, textureScale, applyToAll);

    // Garbage Collection Cleanup 
    useEffect(() => {
        return () => {
            if (gltf && gltf.scene) {
                gltf.scene.traverse((child: any) => {
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
                useLoader.clear(GLTFLoader as any, blobUrl);
            } catch (err) {
                console.error("Error clearing GLTFLoader cache:", err);
            }
        };
    }, [gltf, blobUrl]);

    if (!gltf || !gltf.scene) return null;

    return (
        <Center>
            {/* Notice object={gltf.scene} directly passed without mutations */}
            <primitive object={gltf.scene} dispose={null} />
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
    // After MTLLoader resolves, build a reverse lookup from blob URL → original filename
    // so we can tag loaded textures with their real names for bump→normal detection.
    const reverseBlobMap = useMemo(() => {
        const map: Record<string, string> = {};
        for (const [key, url] of Object.entries(textureMap)) {
            const basename = decodeURIComponent(key)
                .replace(/\\/g, "/")
                .split("/")
                .pop()
                ?.toLowerCase() || "";
            const urlPart = getUrlLastPart(url);
            if (basename && urlPart) map[urlPart] = basename;
        }
        return map;
    }, [textureMap]);

    useMemo(() => {
        if (!materials || !Object.keys(basenameToUrl).length) return;

        const creator = materials as any;
        const matInfoMap: Record<string, any> = creator.materialsInfo || {};
        const matObjMap: Record<string, any> = creator.materials || {};
        const texLoader = new THREE.TextureLoader();

        // First pass: tag every already-loaded texture with its original filename
        // so bump→normal detection in postProcessObject works.
        Object.values(matObjMap).forEach((mat: any) => {
            if (!mat) return;
            const texProps = ["map", "bumpMap", "normalMap", "specularMap", "alphaMap", "aoMap", "emissiveMap", "roughnessMap", "metalnessMap"];
            texProps.forEach(prop => {
                const tex = mat[prop];
                if (tex && tex.isTexture && !tex.name && tex.image) {
                    const src = (tex.image as any).src || "";
                    const srcPart = getUrlLastPart(src);
                    if (srcPart && reverseBlobMap[srcPart]) {
                        tex.name = reverseBlobMap[srcPart];
                    }
                }
            });

            // Also convert specularMap → roughnessMap for MeshPhongMaterial loaded by MTLLoader
            if (mat.specularMap && mat.specularMap.isTexture && !mat.roughnessMap) {
                const texName = (mat.specularMap.name || "").toLowerCase();
                if (texName.includes("rough") || texName.includes("gloss")) {
                    mat.roughnessMap = mat.specularMap;
                    mat.specularMap = null;
                    mat.needsUpdate = true;
                }
            }

            // Convert bumpMap → normalMap if original filename contains "normal"
            if (mat.bumpMap && mat.bumpMap.isTexture) {
                const texName = (mat.bumpMap.name || "").toLowerCase();
                if (texName.includes("normal") || texName.includes("nrm") || texName.includes("nor")) {
                    mat.normalMap = mat.bumpMap;
                    mat.bumpMap = null;
                    mat.normalScale = new THREE.Vector2(1.5, 1.5);
                    mat.needsUpdate = true;
                }
            }
        });

        // Second pass: inject textures from ZIP for any MTL references not yet loaded
        // Map keys from MTL spec → Three.js material property
        const mapFields: Array<[string, string]> = [
            ["map_kd", "map"],
            ["map_ka", "aoMap"],
            ["map_ks", "specularMap"],
            ["map_ns", "roughnessMap"],
            ["map_pr", "roughnessMap"],
            ["map_pm", "metalnessMap"],
            ["map_bump", "bumpMap"],
            ["bump", "bumpMap"],
            ["map_d", "alphaMap"],
        ];

        Object.entries(matInfoMap).forEach(([matName, info]) => {
            const mat = matObjMap[matName];
            if (!mat || !info) return;

            mapFields.forEach(([infoKey, matProp]) => {
                const existingTex = (mat as any)[matProp] as THREE.Texture | null | undefined;
                // Skip if Three.js already loaded a real (non-trivial) texture for this slot.
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
                        "map_kd": ["basecolor", "base_color", "diffuse", "albedo", "_col", "_color", "_diff"],
                        "map_ka": ["ambientocclusion", "occlusion", "_ao", "ambient"],
                        "map_ks": ["specular", "metallic", "_spec", "_metal", "_met"],
                        "map_ns": ["roughness", "glossiness", "_rough", "_gloss", "_rgh"],
                        "map_bump": ["normal", "_nrm", "_nor", "_normal"],
                        "bump": ["normal", "_nrm", "_nor", "_normal", "bump", "height"],
                        "map_d": ["opacity", "alpha", "_opa", "_alpha"],
                        "disp": ["height", "displacement", "_height"],
                        "map_ke": ["emission", "emissive", "_emit"],
                    };
                    const roleWords = ROLE_KEYWORDS[infoKey] ?? [];
                    if (roleWords.length > 0) {
                        const roleMatch = Object.keys(basenameToUrl).find((k) =>
                            roleWords.some((w) => k.toLowerCase().includes(w)) &&
                            isTextureCompatibleWithMaterial(k, matName)
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
    }, [materials, basenameToUrl, reverseBlobMap]);

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
            <primitive object={processedObj} dispose={null} />
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
            <primitive object={processedObj} dispose={null} />
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
    const [isBlend, setIsBlend] = useState<boolean>(false);
    const [extractedBlendBytes, setExtractedBlendBytes] = useState<Uint8Array | null>(null);
    const [isGltf, setIsGltf] = useState<boolean>(false);
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
        setIsBlend(false);
        setExtractedBlendBytes(null);
        setIsGltf(false);
        setZipModelData(null); // Clear stale zip model state immediately to prevent race conditions during async extraction
        setBlobUrl(null); // Clear stale blob URL immediately to prevent race conditions during async extraction

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
                            const hasKnown3DExt = /\.(obj|mtl|glb|gltf|bin|png|jpg|jpeg|tga|webp|bmp|zip|gzip|gz)$/i.test(filename);
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

                    const blendKey = fileKeys.find((key) => key.toLowerCase().endsWith(".blend"));
                    if (blendKey) {
                        const blendContent = filesMap[blendKey];
                        setIsBlend(true);
                        setExtractedBlendBytes(blendContent);
                        return;
                    }

                    const localUrls: string[] = [];

                    const glbKey = fileKeys.find((key) => key.toLowerCase().endsWith(".glb"));
                    const gltfKey = fileKeys.find((key) => key.toLowerCase().endsWith(".gltf"));

                    if (glbKey) {
                        const glbContent = filesMap[glbKey];
                        const glbBlob = new Blob([glbContent as any], { type: "model/gltf-binary" });
                        const glbUrl = URL.createObjectURL(glbBlob);
                        localUrls.push(glbUrl);
                        setIsGltf(true);
                        setZipModelData(null);
                        setBlobUrl(glbUrl);
                        activeBlobUrlsRef.current = localUrls;
                        return;
                    }

                    if (gltfKey) {
                        try {
                            const decoder = new TextDecoder("utf-8");
                            const gltfText = decoder.decode(filesMap[gltfKey]);
                            const gltfJson = JSON.parse(gltfText);

                            const fileBlobUrls: Record<string, string> = {};
                            for (const key of fileKeys) {
                                if (key === gltfKey) continue;
                                const content = filesMap[key];
                                let mimeType = "application/octet-stream";
                                const lowerKey = key.toLowerCase();
                                if (lowerKey.endsWith(".png")) mimeType = "image/png";
                                else if (lowerKey.endsWith(".jpg") || lowerKey.endsWith(".jpeg")) mimeType = "image/jpeg";
                                else if (lowerKey.endsWith(".webp")) mimeType = "image/webp";
                                else if (lowerKey.endsWith(".bin")) mimeType = "application/octet-stream";

                                const blob = new Blob([content as any], { type: mimeType });
                                const url = URL.createObjectURL(blob);
                                fileBlobUrls[key] = url;
                                localUrls.push(url);
                            }

                            const resolveRelativePath = (basePath: string, relativePath: string): string => {
                                if (relativePath.startsWith("data:") || relativePath.startsWith("http:") || relativePath.startsWith("https:")) {
                                    return relativePath;
                                }
                                const baseParts = basePath.split(/[/\\]/);
                                baseParts.pop();
                                const relParts = relativePath.split(/[/\\]/);
                                for (const part of relParts) {
                                    if (part === "." || part === "") continue;
                                    if (part === "..") {
                                        baseParts.pop();
                                    } else {
                                        baseParts.push(part);
                                    }
                                }
                                return baseParts.join("/");
                            };

                            if (Array.isArray(gltfJson.buffers)) {
                                gltfJson.buffers.forEach((buffer: any) => {
                                    if (buffer.uri) {
                                        const resolvedKey = resolveRelativePath(gltfKey, buffer.uri);
                                        const matchedKey = Object.keys(fileBlobUrls).find(k => k.toLowerCase() === resolvedKey.toLowerCase());
                                        if (matchedKey) {
                                            buffer.uri = fileBlobUrls[matchedKey];
                                        }
                                    }
                                });
                            }

                            if (Array.isArray(gltfJson.images)) {
                                gltfJson.images.forEach((image: any) => {
                                    if (image.uri) {
                                        const resolvedKey = resolveRelativePath(gltfKey, image.uri);
                                        const matchedKey = Object.keys(fileBlobUrls).find(k => k.toLowerCase() === resolvedKey.toLowerCase());
                                        if (matchedKey) {
                                            image.uri = fileBlobUrls[matchedKey];
                                        }
                                    }
                                });
                            }

                            const modifiedGltfText = JSON.stringify(gltfJson);
                            const gltfBlob = new Blob([modifiedGltfText], { type: "application/json" });
                            const gltfUrl = URL.createObjectURL(gltfBlob);
                            localUrls.push(gltfUrl);

                            setIsGltf(true);
                            setZipModelData(null);
                            setBlobUrl(gltfUrl);
                            activeBlobUrlsRef.current = localUrls;
                            return;
                        } catch (err) {
                            console.error("Failed to parse and resolve gltf JSON references:", err);
                            const gltfBlob = new Blob([filesMap[gltfKey] as any], { type: "application/json" });
                            const gltfUrl = URL.createObjectURL(gltfBlob);
                            localUrls.push(gltfUrl);
                            setIsGltf(true);
                            setZipModelData(null);
                            setBlobUrl(gltfUrl);
                            activeBlobUrlsRef.current = localUrls;
                            return;
                        }
                    }

                    const objKey = fileKeys.find((key) => key.toLowerCase().endsWith(".obj"));
                    if (!objKey) {
                        throw new Error("No valid .obj, .gltf, or .glb file found inside the ZIP archive.");
                    }
                    const mtlKey = fileKeys.find((key) => key.toLowerCase().endsWith(".mtl"));

                    // Extract all textures and create blob URLs
                    const textureMap: Record<string, string> = {};

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
                        let currentMaterialName = "";
                        const processedMtlLines = mtlLines.map((line) => {
                            const trimmed = line.trim();
                            if (trimmed.startsWith("#") || !trimmed) return line;

                            if (trimmed.toLowerCase().startsWith("newmtl ")) {
                                currentMaterialName = trimmed.slice(7).trim();
                                return line;
                            }

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
                                            "map_kd": ["basecolor", "base_color", "diffuse", "albedo", "_col", "_color", "_diff"],
                                            "map_ka": ["ambientocclusion", "occlusion", "_ao", "ambient"],
                                            "map_ks": ["specular", "metallic", "_spec", "_metal", "_met"],
                                            "map_ns": ["roughness", "glossiness", "_rough", "_gloss", "_rgh"],
                                            "map_pr": ["roughness", "glossiness", "_rough", "_gloss", "_rgh"],
                                            "map_pm": ["metallic", "metalness", "metal", "_metal", "_met"],
                                            "map_bump": ["normal", "normalmap", "_nrm", "_nor", "_normal"],
                                            "bump": ["normal", "normalmap", "_nrm", "_nor", "_normal", "bump", "height"],
                                            "map_d": ["opacity", "alpha", "transparency", "_opa", "_alpha"],
                                            "disp": ["height", "displacement", "disp", "_height", "_h"],
                                            "map_ke": ["emission", "emissive", "_emit", "_emissive"],
                                            "decal": ["decal"],
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
                                                    if (isTextureCompatibleWithMaterial(bn, currentMaterialName)) {
                                                        suffixMatchUrl = textureMap[key];
                                                        suffixMatchBasename = bn;
                                                        console.log(`[3D Loader] MTL role-matched "${keyword}" → "${bn}" (material: "${currentMaterialName}")`);
                                                        break;
                                                    }
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

                // Check magic bytes for Blender (.blend): BLENDER
                if (finalBytes && finalBytes.length >= 7 &&
                    finalBytes[0] === 66 && // B
                    finalBytes[1] === 76 && // L
                    finalBytes[2] === 69 && // E
                    finalBytes[3] === 78 && // N
                    finalBytes[4] === 68 && // D
                    finalBytes[5] === 69 && // E
                    finalBytes[6] === 82    // R
                ) {
                    setIsBlend(true);
                }

                // Check magic bytes for GLB: glTF (0x67, 0x6c, 0x54, 0x46)
                let isRawGltf = false;
                if (finalBytes && finalBytes.length >= 4 &&
                    finalBytes[0] === 0x67 && // g
                    finalBytes[1] === 0x6c && // l
                    finalBytes[2] === 0x54 && // T
                    finalBytes[3] === 0x46    // F
                ) {
                    isRawGltf = true;
                }

                const lowerData = dataToProcess.toLowerCase();
                const isGltfExtension = lowerData.includes(".gltf") || lowerData.includes(".glb");
                let looksLikeGltfJson = false;
                if (finalBytes) {
                    try {
                        const text = new TextDecoder("utf-8").decode(finalBytes);
                        if (text.trim().startsWith("{") && text.includes('"asset"')) {
                            looksLikeGltfJson = true;
                        }
                    } catch (e) { }
                } else {
                    if (dataToProcess.trim().startsWith("{") && dataToProcess.includes('"asset"')) {
                        looksLikeGltfJson = true;
                    }
                }

                if (isRawGltf || isGltfExtension || looksLikeGltfJson) {
                    setIsGltf(true);
                }

                let singleUrl: string;
                if (finalBytes) {
                    const mimeType = (isRawGltf || isGltfExtension) ? "model/gltf-binary" : (looksLikeGltfJson ? "application/json" : "text/plain");
                    const blob = new Blob([finalBytes as any], { type: mimeType });
                    singleUrl = URL.createObjectURL(blob);
                } else {
                    // Plain text file or a URL
                    if (dataToProcess.startsWith("http") || dataToProcess.startsWith("blob:")) {
                        singleUrl = dataToProcess;
                    } else {
                        const mimeType = looksLikeGltfJson ? "application/json" : "text/plain";
                        const blob = new Blob([dataToProcess], { type: mimeType });
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

    if (isBlend) {
        return (
            <div className="w-full h-[400px] bg-slate-950/70 rounded-2xl border border-white/10 flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden shadow-2xl">
                {/* Visual accent backdrops */}
                <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4 relative shadow-inner">
                    <svg className="w-8 h-8 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12a4 4 0 018 0M12 8v4" />
                        <circle cx="12" cy="12" r="2" fill="currentColor" />
                    </svg>
                </div>
                <h3 className="text-white font-semibold text-base mb-1.5">Tệp nguồn Blender (.blend)</h3>
                <p className="text-slate-400 text-xs max-w-sm leading-relaxed mb-6">
                    Định dạng này là tệp nguồn 3D gốc từ Blender. Do trình duyệt web không hỗ trợ dựng hình trực tiếp tệp .blend, bạn có thể tải xuống để chỉnh sửa và làm việc trực tiếp trong Blender.
                </p>
                <div className="flex gap-3 pointer-events-auto">
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                let decompressed: Uint8Array;
                                if (extractedBlendBytes) {
                                    decompressed = extractedBlendBytes;
                                } else {
                                    const cleanData = objData.startsWith("gzip:") ? objData.slice(5) : objData.startsWith("zip:") ? objData.slice(4) : objData;
                                    const bytes = base64ToBytes(cleanData);
                                    decompressed = await decompressIfGzip(bytes);
                                }
                                const blob = new Blob([decompressed as any], { type: "application/octet-stream" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = "model.blend";
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                toast.success("Đang tải xuống tệp nguồn .blend...");
                            } catch (err) {
                                console.error("Failed to download blend file:", err);
                                toast.error("Không thể giải nén và tải xuống tệp.");
                            }
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Tải xuống tệp .blend
                    </button>
                </div>
            </div>
        );
    }

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
                    shadows="soft"
                    camera={{ position: [0, 0, 5], fov: 45 }}
                    gl={{
                        powerPreference: "high-performance",
                        antialias: true, // Enable antialiasing for smooth premium borders
                        alpha: true,
                        stencil: false,
                        depth: true,
                        logarithmicDepthBuffer: true, // Prevent Z-fighting and flicker between close chunks/planes
                        outputColorSpace: THREE.SRGBColorSpace, // Maintain true sRGB colorspace output
                        toneMapping: THREE.ACESFilmicToneMapping, // ACES Filmic Tone Mapping prevents color clipping and overexposure
                        toneMappingExposure: 1.0,
                    }}
                    dpr={typeof window !== "undefined" ? window.devicePixelRatio : [1, 2]} // Force native high-fidelity scaling
                    // Use custom timer to suppress Clock deprecation warning
                    {...{ clock: timer } as any}
                >
                    <Stage intensity={1.5} environment="city" adjustCamera={1.2}>
                        {isGltf && blobUrl ? (
                            <GLTFModel
                                blobUrl={blobUrl}
                                textureScale={textureScale}
                                applyToAll={applyToAll}
                            />
                        ) : zipModelData ? (
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
