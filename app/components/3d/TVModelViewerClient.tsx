"use client";
import React, { Suspense, useMemo, useEffect, useRef } from "react";
import { Canvas, useLoader, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Stage, Center } from "@react-three/drei";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { RGBShiftShader } from "three/addons/shaders/RGBShiftShader.js";
import * as THREE from "three";

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

const { Timer } = THREE;

// Custom shader material for the TV hologram scanline effect reproducing Blender nodes
const TVHologramMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.0, 0.3, 0.5), // Subtle cyan glass tint
    roughness: 0.15,
    metalness: 0.0,
    ior: 1.5,
    transmission: 1.0, // Full physical glass transmission
    thickness: 1.8,    // Refraction thickness
    transparent: true,
    depthWrite: false, // Prevents self-occlusion issues with transparent glass layering
    side: THREE.DoubleSide
});

(TVHologramMaterial as any).userData = {
    uScanlineScale: { value: 64.0 },
    uGlowStrength: { value: 0.2 }
};

TVHologramMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uScanlineScale = (TVHologramMaterial as any).userData.uScanlineScale;
    shader.uniforms.uGlowStrength = (TVHologramMaterial as any).userData.uGlowStrength;

    // 1. Pass local position from vertex to fragment shader
    shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
         varying vec3 vLocalPosition;`
    );
    shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vLocalPosition = position;`
    );

    // 2. Fragment shader setup: inject uniforms, varyings, noise and fBm functions
    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
         uniform float uScanlineScale;
         uniform float uGlowStrength;
         varying vec3 vLocalPosition;
         
         // 3D Noise and fBm for Wave Texture Distortion and Noise Emission
         float hash(float n) { return fract(sin(n) * 43758.5453123); }
         float noise(vec3 x) {
             vec3 p = floor(x);
             vec3 f = fract(x);
             f = f*f*(3.0-2.0*f);
             float n = p.x + p.y*157.0 + 113.0*p.z;
             return mix(mix(mix(hash(n+  0.0), hash(n+  1.0),f.x),
                            mix(hash(n+157.0), hash(n+158.0),f.x),f.y),
                        mix(mix(hash(n+113.0), hash(n+114.0),f.x),
                            mix(hash(n+270.0), hash(n+271.0),f.x),f.y),f.z);
         }
         float fbm(vec3 p) {
             float v = 0.0;
             float a = 0.5;
             vec3 shift = vec3(100.0);
             for (int i = 0; i < 2; ++i) {
                 v += a * noise(p);
                 p = p * 2.0 + shift;
                 a *= 0.5;
             }
             return v;
         }
        `
    );

    // 3. Apply scanlines, Fresnel glow, bevel edge detection, and mask at the very end of shading
    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         // 1. Wave Texture scanlines with fbm coordinate distortion (reproducing Wave Texture Distortion 1.0, Scale 20.0 in Blender)
         float scale = uScanlineScale;
         float distortion = 1.0;
         float noiseVal = fbm(vLocalPosition * 1.5);
         float waveArg = vLocalPosition.y * scale + distortion * noiseVal * scale;
         float wave = 0.5 + 0.5 * sin(waveArg);
         
         // 2. Layer Weight Fresnel Edge Glow
         vec3 viewDir = normalize(vViewPosition);
         vec3 smoothNorm = normalize(normal);
         float facing = 1.0 - max(dot(smoothNorm, viewDir), 0.0);
         float fresnel = pow(facing, 3.5);
         float fresnelFac = smoothstep(0.1, 0.468, fresnel);
         
         // 3. Bevel Edge Glow (Calculates dot product between smoothed normal and flat normal derived from screen position derivatives)
         vec3 flatNorm = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
         float bevelDot = abs(dot(smoothNorm, flatNorm));
         float bevelFac = smoothstep(0.915, 0.88, bevelDot);
         
         // 4. Depth-based glow transition (Camera Z / Local Z volumetric glow)
         float depthMix = smoothstep(-0.8, 0.8, vLocalPosition.z);
         vec3 cyanColor = vec3(0.0, 0.76, 1.0);
         vec3 whiteColor = vec3(1.0, 1.0, 1.0);
         
         // Mix Translucent and Noise Emission
         vec3 baseGlow = mix(cyanColor * (fbm(vLocalPosition * 10.0) * 10.0), vec3(0.0), depthMix);
         
         // Mix in Fresnel Edge Glow
         vec3 emissionColor = mix(baseGlow, cyanColor * 10.0, fresnelFac);
         
         // Mix in Bevel Edge Glow (White)
         emissionColor = mix(emissionColor, whiteColor * 10.0, bevelFac);
         
         // 5. Apply the glowing emission and scanline mask
         gl_FragColor.rgb += emissionColor * uGlowStrength;
         
         // Combine alpha with scanline mask
         gl_FragColor.a *= wave;
         
         // Discard empty scanline pixels to show clean background
         if (gl_FragColor.a < 0.15) discard;
        `
    );
};

interface TVModelProps {
    className?: string;
    bloomStrength?: number;
}

function TVModel() {
    const gltf = useLoader(GLTFLoader as any, "/tv.gltf", (loader: any) => {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
        loader.setDRACOLoader(dracoLoader);
    });

    useEffect(() => {
        if (gltf && gltf.scene) {
            gltf.scene.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.geometry && !child.geometry.attributes.normal) {
                        child.geometry.computeVertexNormals();
                    }
                    const mesh = child as THREE.Mesh;
                    if (mesh.material) {
                        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                        const isTvMaterial = materials.some((mat: any) => mat.name === "tv");
                        if (isTvMaterial) {
                            if (Array.isArray(mesh.material)) {
                                mesh.material = mesh.material.map((mat: any) => {
                                    if (mat.name === "tv") return TVHologramMaterial;
                                    return mat;
                                });
                            } else {
                                mesh.material = TVHologramMaterial;
                            }
                        }
                    }
                }
            });
        }
    }, [gltf]);

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
                useLoader.clear(GLTFLoader as any, "/tv.gltf");
            } catch (err) {
                console.error("Error clearing GLTFLoader cache:", err);
            }
        };
    }, [gltf]);

    if (!gltf || !gltf.scene) return null;

    return (
        <Center>
            <primitive object={gltf.scene} dispose={null} />
        </Center>
    );
}

// Bloom effect composer component
function BloomEffect({
    strength,
    radius,
    threshold,
    chromaticAberration
}: {
    strength: number;
    radius: number;
    threshold: number;
    chromaticAberration: boolean;
}) {
    const { gl, scene, camera, size } = useThree();
    const composerRef = useRef<EffectComposer | null>(null);

    const composer = useMemo(() => {
        const comp = new EffectComposer(gl);
        comp.addPass(new RenderPass(scene, camera));

        const bloom = new UnrealBloomPass(new THREE.Vector2(size.width, size.height), strength, radius, threshold);
        comp.addPass(bloom);

        if (chromaticAberration) {
            const rgbShift = new ShaderPass(RGBShiftShader);
            rgbShift.uniforms.amount.value = 0.0012;
            comp.addPass(rgbShift);
        }

        comp.addPass(new OutputPass());
        return comp;
    }, [gl, scene, camera, size, strength, radius, threshold, chromaticAberration]);

    useEffect(() => {
        composerRef.current = composer;
        return () => {
            composer.dispose();
            if (composerRef.current === composer) {
                composerRef.current = null;
            }
        };
    }, [composer]);

    useFrame(() => {
        if (composerRef.current) {
            composerRef.current.render();
        }
    }, 1);

    return null;
}

class WebGLErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.warn("WebGL Context Creation failed, rendering fallback static preview:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

const StaticTVFallback = () => (
    <div className="w-full h-full relative flex items-center justify-center bg-slate-950/20 overflow-hidden">
        <img
            src="/a940202526210112ed774ee070cb6e1f584158f8.png"
            alt="TV Hologram Preview"
            className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />
    </div>
);

export default function TVModelViewerClient({
    className = "w-full h-full",
    bloomStrength = 0.2
}: TVModelProps) {
    const glRef = useRef<THREE.WebGLRenderer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = React.useState(true);
    const timer = useMemo(() => new Timer(), []);

    // Sync TVHologramMaterial uniforms with component states
    useEffect(() => {
        if ((TVHologramMaterial as any).userData?.uGlowStrength) {
            (TVHologramMaterial as any).userData.uGlowStrength.value = bloomStrength;
        }
    }, [bloomStrength]);

    // Handle intersection observer and page visibility state
    useEffect(() => {
        const checkVisibility = () => {
            return document.visibilityState === "visible";
        };

        const handleVisibilityChange = () => {
            setIsVisible(checkVisibility());
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        let observer: IntersectionObserver | null = null;
        if (typeof window !== "undefined" && containerRef.current) {
            observer = new IntersectionObserver(
                ([entry]) => {
                    setIsVisible(entry.isIntersecting && checkVisibility());
                },
                { threshold: 0.05 }
            );
            observer.observe(containerRef.current);
        }

        // Set initial visibility
        setIsVisible(checkVisibility());

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (observer) {
                observer.disconnect();
            }
        };
    }, []);

    // Dispose of the renderer on unmount to free GPU contexts
    useEffect(() => {
        return () => {
            if (glRef.current) {
                try {
                    glRef.current.dispose();
                } catch (e) {
                    console.error("Failed to dispose WebGL renderer on unmount:", e);
                }
                glRef.current = null;
            }
        };
    }, []);

    return (
        <div ref={containerRef} className={`w-full overflow-hidden relative ${className}`}>
            <WebGLErrorBoundary fallback={<StaticTVFallback />}>
                {!isVisible ? (
                    <StaticTVFallback />
                ) : (
                    <Suspense fallback={
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
                            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs uppercase tracking-widest opacity-60">Preparing TV Model...</span>
                        </div>
                    }>
                        <Canvas
                            onCreated={({ gl }) => {
                                glRef.current = gl;
                            }}
                            shadows="soft"
                            camera={{ position: [0, 0, 5], fov: 45 }}
                            gl={{
                                powerPreference: "high-performance",
                                antialias: true,
                                alpha: true,
                                stencil: true,
                                depth: true,
                                logarithmicDepthBuffer: false,
                                outputColorSpace: THREE.SRGBColorSpace,
                                toneMapping: THREE.ACESFilmicToneMapping,
                                toneMappingExposure: 1.0,
                            }}
                            dpr={typeof window !== "undefined" ? window.devicePixelRatio : [1, 2]}
                            {...{ clock: timer } as any}
                        >
                            <Stage intensity={1.5} environment="city" adjustCamera={1.2}>
                                <TVModel />
                            </Stage>
                            <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
                            <BloomEffect
                                strength={bloomStrength}
                                radius={0.5}
                                threshold={0.2}
                                chromaticAberration={true}
                            />
                        </Canvas>
                    </Suspense>
                )}
            </WebGLErrorBoundary>
        </div>
    );
}
