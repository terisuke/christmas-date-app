declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import * as THREE from 'three';

  export interface GLTF {
    animations: THREE.AnimationClip[];
    scene: THREE.Group;
    scenes: THREE.Group[];
    cameras: THREE.Camera[];
    asset: object;
    userData: Record<string, unknown>;
  }

  export class GLTFParser {
    json: object;
  }

  export class GLTFLoader extends THREE.Loader {
    constructor(manager?: THREE.LoadingManager);
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (error: ErrorEvent) => void
    ): void;
    loadAsync(url: string, onProgress?: (event: ProgressEvent) => void): Promise<GLTF>;
    parse(
      data: ArrayBuffer | string,
      path: string,
      onLoad: (gltf: GLTF) => void,
      onError?: (error: ErrorEvent) => void
    ): void;
    register(callback: (parser: GLTFParser) => object): this;
    unregister(callback: (parser: GLTFParser) => object): this;
  }
}

declare module '@pixiv/three-vrm' {
  import * as THREE from 'three';
  import { GLTF, GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader';

  export class VRM {
    scene: THREE.Group;
    expressionManager: VRMExpressionManager | null;
    lookAt: VRMLookAt | null;
    update(delta: number): void;
  }

  export class VRMExpressionManager {
    setValue(name: string, value: number): void;
    getValue(name: string): number | null;
    update(): void;
  }

  export class VRMLookAt {
    target: THREE.Object3D | null;
  }

  export class VRMLoaderPlugin {
    constructor(parser: GLTFParser);
  }

  export type VRMExpressionPresetName =
    | 'happy' | 'angry' | 'sad' | 'relaxed' | 'surprised'
    | 'neutral' | 'blink' | 'blinkLeft' | 'blinkRight'
    | 'lookUp' | 'lookDown' | 'lookLeft' | 'lookRight';
}

declare module '*.vrm' {
  const content: number;
  export default content;
}
