// import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "@react-navigation/native";
import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import { Renderer, THREE } from "expo-three";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import ThreeGlobe from "three-globe";
import { useResolveClassNames } from "uniwind";

import { getEarthNightPixelsIfReady, preloadEarthNightPixels } from "@/lib/globe-earth-pixels";

// import {
//   latestCheckpointQueryOptions,
//   validatorsGeoQueryOptions,
//   validatorsQueryOptions,
// } from "@/features/validators/services";

const GLOBE_PAN_ROTATION_SENSITIVITY = 0.004;
const GLOBE_AUTO_ROTATE_RAD_PER_SEC = 0.16;

const CAMERA_Z_INITIAL = 300;
const CAMERA_Z_MIN = 100;
const CAMERA_Z_MAX = 500;

function clampCameraZ(z: number) {
  return Math.min(CAMERA_Z_MAX, Math.max(CAMERA_Z_MIN, z));
}

export default function HomeTab() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const globeViewportHeight = Math.round(windowHeight * 0.75);
  const activityColor = useResolveClassNames("text-primary").color;
  const isFocused = useIsFocused();
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const globeMeshRef = useRef<THREE.Object3D | null>(null);
  const autoRotateRef = useRef(true);
  const cameraZRef = useRef(CAMERA_Z_INITIAL);
  const pinchBaseCameraZRef = useRef(CAMERA_Z_INITIAL);

  const applyGlobePanDelta = useCallback((dx: number, dy: number) => {
    const globe = globeMeshRef.current;
    if (!globe) return;
    globe.rotation.y += dx * GLOBE_PAN_ROTATION_SENSITIVITY;
    globe.rotation.x += dy * GLOBE_PAN_ROTATION_SENSITIVITY;
  }, []);

  const pauseGlobeAutoRotate = useCallback(() => {
    autoRotateRef.current = false;
  }, []);

  const resumeGlobeAutoRotate = useCallback(() => {
    autoRotateRef.current = true;
  }, []);

  const beginCameraPinch = useCallback(() => {
    pinchBaseCameraZRef.current = cameraZRef.current;
    pauseGlobeAutoRotate();
  }, [pauseGlobeAutoRotate]);

  const applyCameraPinchScale = useCallback((scale: number) => {
    if (scale <= 0) return;
    cameraZRef.current = clampCameraZ(pinchBaseCameraZRef.current / scale);
  }, []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          scheduleOnRN(pauseGlobeAutoRotate);
        })
        .onChange((e) => {
          scheduleOnRN(applyGlobePanDelta, e.changeX, e.changeY);
        })
        .onFinalize(() => {
          scheduleOnRN(resumeGlobeAutoRotate);
        }),
    [applyGlobePanDelta, pauseGlobeAutoRotate, resumeGlobeAutoRotate],
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          scheduleOnRN(beginCameraPinch);
        })
        .onChange((e) => {
          scheduleOnRN(applyCameraPinchScale, e.scale);
        })
        .onFinalize(() => {
          scheduleOnRN(resumeGlobeAutoRotate);
        }),
    [applyCameraPinchScale, beginCameraPinch, resumeGlobeAutoRotate],
  );

  const globeGestures = useMemo(
    () => Gesture.Simultaneous(panGesture, pinchGesture),
    [panGesture, pinchGesture],
  );

  useEffect(() => {
    if (!isFocused) {
      setIsGlobeReady(false);
      globeMeshRef.current = null;
    }
  }, [isFocused]);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f19);

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 100);
    directionalLight.position.set(100, 50, 50);
    directionalLight.target.position.set(0, 0, 0);
    scene.add(directionalLight.target);
    scene.add(directionalLight);

    const pixels = getEarthNightPixelsIfReady() ?? (await preloadEarthNightPixels());

    const tex = new THREE.DataTexture(pixels.data, pixels.width, pixels.height, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false;
    tex.unpackAlignment = 1;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;

    const globeMat = new THREE.MeshPhongMaterial({
      color: 0x1e3a5f,
      shininess: 12,
    });

    globeMat.map = tex;
    globeMat.color.set(0xffffff);
    globeMat.shininess = 8;
    globeMat.needsUpdate = true;

    const myGlobe = new ThreeGlobe().globeMaterial(globeMat).showAtmosphere(true);
    myGlobe.position.set(0, 0, 0);
    scene.add(myGlobe);
    globeMeshRef.current = myGlobe;

    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 0, cameraZRef.current);
    camera.lookAt(0, 0, 0);

    let lastTime = performance.now();

    const render = () => {
      requestAnimationFrame(render);
      const now = performance.now();
      const dt = (now - lastTime) * 0.001;
      lastTime = now;
      camera.position.z = cameraZRef.current;
      if (autoRotateRef.current) {
        myGlobe.rotation.y -= dt * GLOBE_AUTO_ROTATE_RAD_PER_SEC;
      }
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    render();
    setIsGlobeReady(true);
  };
  // const systemQuery = useQuery({ ...validatorsQueryOptions(), enabled: false });
  // const geoQuery = useQuery(validatorsGeoQueryOptions(systemQuery.data ?? null));
  // const latestCheckpoint = useQuery(
  //   latestCheckpointQueryOptions(!!systemQuery.data, !!geoQuery.data),
  // );

  // console.log(!!systemQuery.data);
  // console.log(!!geoQuery.data);

  // console.log(latestCheckpoint.data);

  // if (systemQuery.isPending || geoQuery.isPending) {
  //   return (
  //     <View className="grow items-center bg-[#0a0e14] text-amber-400">
  //       <Text>Loading</Text>
  //     </View>
  //   );
  // }

  return (
    <ScrollView contentContainerClassName="grow bg-bg pb-[80]">
      {isFocused ? (
        <>
          <GestureDetector gesture={globeGestures}>
            <View className="w-full" style={{ height: globeViewportHeight }}>
              <GLView className="flex-1" onContextCreate={onContextCreate} />
              {!isGlobeReady && (
                <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
                  <ActivityIndicator size="large" color={activityColor} />
                </View>
              )}
            </View>
          </GestureDetector>
          <View className="px-4 gap-2"></View>
        </>
      ) : null}

      <View className="z-10 w-full h-auto absolute" style={{ top: insets.top }}>
        <View className="grow justify-center items-center">
          <Pressable className="flex-row gap-2 bg-card p-6 rounded-4xl">
            <Text className="text-white">validators 200</Text>
            <Text className="text-white">countries 25</Text>
            <Text className="text-white">cities 56</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
