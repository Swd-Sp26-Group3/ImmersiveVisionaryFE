declare module 'three/addons/loaders/MTLLoader' {
    export class MTLLoader extends import('three').Loader {
        constructor(manager?: import('three').LoadingManager);
        load(
            url: string,
            onLoad: (materialCreator: MTLLoader.MaterialCreator) => void,
            onProgress?: (event: ProgressEvent) => void,
            onError?: (event: ErrorEvent) => void
        ): void;
        parse(text: string, path: string): MTLLoader.MaterialCreator;
        setMaterialOptions(options: MTLLoader.MaterialOptions): this;
    }

    export namespace MTLLoader {
        export interface MaterialOptions {
            side?: number;
            wrap?: number;
            normalizeRGB?: boolean;
            ignoreZeroRGBs?: boolean;
            invertTrProperty?: boolean;
        }

        export class MaterialCreator {
            constructor(baseUrl?: string, options?: import('three').MaterialOptions);
            materials: { [key: string]: import('three').Material };
            preload(): void;
            getMaterial(materialName: string): import('three').Material;
            getAsArray(): import('three').Material[];
            create(materialName: string): import('three').Material;
        }
    }
}

declare module 'three/addons/loaders/OBJLoader' {
    export class OBJLoader extends import('three').Loader {
        constructor(manager?: import('three').LoadingManager);
        materials: import('three/addons/loaders/MTLLoader').MTLLoader.MaterialCreator;
        load(
            url: string,
            onLoad: (group: import('three').Group) => void,
            onProgress?: (event: ProgressEvent) => void,
            onError?: (event: ErrorEvent) => void
        ): void;
        parse(data: string): import('three').Group;
        setMaterials(materials: import('three/addons/loaders/MTLLoader').MTLLoader.MaterialCreator): this;
    }
}

// ESM Extension Mappings
declare module 'three/addons/loaders/MTLLoader.js' { export * from 'three/addons/loaders/MTLLoader'; }
declare module 'three/addons/loaders/OBJLoader.js' { export * from 'three/addons/loaders/OBJLoader'; }

// Legacy paths if needed
declare module 'three/examples/jsm/loaders/OBJLoader' { export * from 'three/addons/loaders/OBJLoader'; }
