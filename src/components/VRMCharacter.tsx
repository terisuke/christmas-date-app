import React, { useRef, useEffect, useState, Suspense, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, Text } from 'react-native';

// VRM表情タイプ
export type VRMExpression = 'neutral' | 'happy' | 'shy' | 'surprised' | 'sad' | 'thinking';

interface VRMCharacterProps {
  expression?: VRMExpression;
  timeOfDay?: 'morning' | 'afternoon' | 'night';
  style?: object;
}

// 背景色（時間帯別）
const BACKGROUND_COLORS: Record<string, string> = {
  morning: '#E8F4FD',
  afternoon: '#FFF8E7',
  night: '#1a1a2e',
};

// フォールバック用の絵文字
const EXPRESSION_EMOJI: Record<VRMExpression, string> = {
  neutral: '(._. )',
  happy: '(*^_^*)',
  shy: '(*/ω＼*)',
  surprised: '(°o°)',
  sad: '(；_;)',
  thinking: '(・_・?)',
};

// VRM用のThree.jsコンポーネント（条件付きインポート）
let VRMCanvas: React.ComponentType<{
  expression: VRMExpression;
  timeOfDay: string;
  onLoad: () => void;
  onError: (error: Error) => void;
}> | null = null;

// 動的インポートを試みる（Expo SDKの互換性問題を回避）
const loadVRMComponents = async () => {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    // Three.js関連のインポートを試行
    const threeModule = await import('three');
    const fiberModule = await import('@react-three/fiber/native');
    const vrmModule = await import('@pixiv/three-vrm');
    const gltfModule = await import('three/examples/jsm/loaders/GLTFLoader');
    const assetModule = await import('expo-asset');

    const { Canvas, useFrame, useThree } = fiberModule;
    const { VRM, VRMLoaderPlugin } = vrmModule;
    const { GLTFLoader } = gltfModule;
    const { Asset } = assetModule;
    const THREE = threeModule;

    // ライティング設定（時間帯別）
    const LIGHTING: Record<string, { ambient: number; directional: number; color: string }> = {
      morning: { ambient: 0.7, directional: 0.6, color: '#FFF5E6' },
      afternoon: { ambient: 0.8, directional: 0.7, color: '#FFFFFF' },
      night: { ambient: 0.4, directional: 0.3, color: '#E6E6FF' },
    };

    // VRMモデルコンポーネント
    function VRMModel({
      expression,
      onLoad,
      onError,
    }: {
      expression: VRMExpression;
      onLoad?: () => void;
      onError?: (error: Error) => void;
    }) {
      const vrmRef = useRef<InstanceType<typeof VRM> | null>(null);
      const { scene } = useThree();
      const [isLoaded, setIsLoaded] = useState(false);

      useEffect(() => {
        let isMounted = true;

        const loadVRM = async () => {
          try {
            const loader = new GLTFLoader();
            loader.register((parser: any) => new VRMLoaderPlugin(parser));

            // VRMファイルの読み込み
            const assets = await Asset.loadAsync(require('../../assets/vrm/kaori.vrm'));
            const uri = assets[0].localUri || assets[0].uri;

            loader.load(
              uri,
              (gltf: any) => {
                if (!isMounted) return;

                const vrm = gltf.userData.vrm as InstanceType<typeof VRM>;
                vrmRef.current = vrm;

                // シーンに追加
                scene.add(vrm.scene);

                // カメラ位置調整（バストアップ）
                vrm.scene.position.set(0, -0.65, 0);
                vrm.scene.rotation.y = Math.PI;

                setIsLoaded(true);
                onLoad?.();
              },
              undefined,
              (error: any) => {
                console.error('VRM load error:', error);
                onError?.(error as Error);
              }
            );
          } catch (error) {
            console.error('VRM asset error:', error);
            onError?.(error as Error);
          }
        };

        loadVRM();

        return () => {
          isMounted = false;
          if (vrmRef.current) {
            scene.remove(vrmRef.current.scene);
            vrmRef.current = null;
          }
        };
      }, [scene, onLoad, onError]);

      // 表情の更新
      useEffect(() => {
        if (!vrmRef.current?.expressionManager || !isLoaded) return;

        const em = vrmRef.current.expressionManager;

        // 全表情をリセット
        em.setValue('neutral', 0);
        em.setValue('happy', 0);
        em.setValue('sad', 0);
        em.setValue('surprised', 0);
        em.setValue('angry', 0);

        // 表情を適用
        switch (expression) {
          case 'happy':
            em.setValue('happy', 1.0);
            break;
          case 'shy':
            em.setValue('happy', 0.4);
            break;
          case 'surprised':
            em.setValue('surprised', 1.0);
            break;
          case 'sad':
            em.setValue('sad', 1.0);
            break;
          case 'thinking':
            em.setValue('neutral', 0.5);
            break;
          default:
            em.setValue('neutral', 1.0);
        }

        em.update();
      }, [expression, isLoaded]);

      // アニメーションループ（まばたき）
      useFrame((state, delta) => {
        if (vrmRef.current) {
          vrmRef.current.update(delta);

          // 自然なまばたき
          const time = state.clock.getElapsedTime();
          const blinkTrigger = Math.sin(time * 0.3) > 0.995;

          if (vrmRef.current.expressionManager) {
            vrmRef.current.expressionManager.setValue('blink', blinkTrigger ? 1.0 : 0);
          }
        }
      });

      return null;
    }

    // VRMキャンバスコンポーネント
    VRMCanvas = function VRMCanvasComponent({
      expression,
      timeOfDay,
      onLoad,
      onError,
    }: {
      expression: VRMExpression;
      timeOfDay: string;
      onLoad: () => void;
      onError: (error: Error) => void;
    }) {
      const lighting = LIGHTING[timeOfDay] || LIGHTING.afternoon;

      return (
        <Canvas camera={{ position: [0, 0, 1.2], fov: 35 }}>
          <ambientLight intensity={lighting.ambient} color={lighting.color} />
          <directionalLight
            position={[1, 1, 1]}
            intensity={lighting.directional}
            color={lighting.color}
          />
          <Suspense fallback={null}>
            <VRMModel expression={expression} onLoad={onLoad} onError={onError} />
          </Suspense>
        </Canvas>
      );
    };

    return true;
  } catch (error) {
    console.warn('VRM components not available:', error);
    return false;
  }
};

export default function VRMCharacter({
  expression = 'neutral',
  timeOfDay = 'afternoon',
  style,
}: VRMCharacterProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [vrmAvailable, setVrmAvailable] = useState(false);
  const [componentsLoaded, setComponentsLoaded] = useState(false);

  // VRMコンポーネントの動的ロード
  useEffect(() => {
    let isMounted = true;

    loadVRMComponents().then((available) => {
      if (isMounted) {
        setVrmAvailable(available);
        setComponentsLoaded(true);
        if (!available) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('VRM error:', error);
    setIsLoading(false);
    setHasError(true);
  }, []);

  // Web or コンポーネント未ロードの場合はフォールバック
  if (Platform.OS === 'web' || !componentsLoaded || !vrmAvailable || hasError) {
    return (
      <View
        style={[
          styles.fallback,
          { backgroundColor: BACKGROUND_COLORS[timeOfDay] },
          style,
        ]}
      >
        <Text style={[styles.emoji, timeOfDay === 'night' && styles.emojiNight]}>
          {EXPRESSION_EMOJI[expression]}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: BACKGROUND_COLORS[timeOfDay] },
        style,
      ]}
    >
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ff4757" />
        </View>
      )}
      {VRMCanvas && (
        <VRMCanvas
          expression={expression}
          timeOfDay={timeOfDay}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fallback: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    color: '#555',
  },
  emojiNight: {
    color: '#ccc',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 10,
  },
});
