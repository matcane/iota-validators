import type { THREE } from "expo-three";
import { useCallback, useMemo, useRef } from "react";
import { Gesture } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";

const GLOBE_PAN_ROTATION_SENSITIVITY = 0.004;

const CAMERA_Z_INITIAL = 300;
const CAMERA_Z_MIN = 250;
const CAMERA_Z_MAX = 500;

export function useGlobeRotation() {
  const globeObjRef = useRef<THREE.Object3D | null>(null);
  const autoRotateRef = useRef(true);
  const cameraDepthRef = useRef(CAMERA_Z_INITIAL);
  const pinchBaseCameraZRef = useRef(CAMERA_Z_INITIAL);

  const applyGlobePanDelta = useCallback((dx: number, dy: number) => {
    const globe = globeObjRef.current;
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
    pinchBaseCameraZRef.current = cameraDepthRef.current;
    pauseGlobeAutoRotate();
  }, [pauseGlobeAutoRotate]);

  const applyCameraPinchScale = useCallback((scale: number) => {
    if (scale <= 0) return;
    cameraDepthRef.current = Math.min(
      CAMERA_Z_MAX,
      Math.max(CAMERA_Z_MIN, pinchBaseCameraZRef.current / scale),
    );
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

  return { globeGestures, globeObjRef, autoRotateRef, cameraDepthRef };
}
