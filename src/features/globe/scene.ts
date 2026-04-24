import type { ExpoWebGLRenderingContext } from "expo-gl";
import { Renderer, THREE } from "expo-three";
import ThreeGlobe from "three-globe";

import {
  getEarthNightPixelsIfReady,
  preloadEarthNightPixels,
  type EarthPixelBuffer,
} from "@/lib/globe-earth-pixels";

const GLOBE_AUTO_ROTATE_RAD_PER_SEC = 0.16;

interface GLViewContextProps {
  gl: ExpoWebGLRenderingContext;
  refs: {
    globeObjRef: React.RefObject<THREE.Object3D<THREE.Object3DEventMap> | null>;
    autoRotateRef: React.RefObject<boolean>;
    cameraDepthRef: React.RefObject<number>;
  };
  callbacks: { setIsGlobeReady: (value: React.SetStateAction<boolean>) => void };
  data: {
    cities: {
      readonly lat: number;
      readonly lng: number;
      readonly color: "#ffffff";
    }[];
    links: {
      readonly startLat: number;
      readonly startLng: number;
      readonly endLat: number;
      readonly endLng: number;
      readonly color: "#5f65f7";
    }[];
  };
}

export const onContextCreate = async ({ gl, refs, callbacks, data }: GLViewContextProps) => {
  const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
  const { globeObjRef, autoRotateRef, cameraDepthRef } = refs;
  const { cities, links } = data;
  const { setIsGlobeReady } = callbacks;

  const renderer = new Renderer({ gl });
  renderer.setSize(width, height);

  const pixels = getEarthNightPixelsIfReady() ?? (await preloadEarthNightPixels());
  const { scene, globe: myGlobe } = buildGlobeScene(pixels, cities, links);

  globeObjRef.current = myGlobe;

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 0, cameraDepthRef.current);
  camera.lookAt(0, 0, 0);

  let lastTime = performance.now();

  const render = () => {
    requestAnimationFrame(render);
    const now = performance.now();
    const dt = (now - lastTime) * 0.001;
    lastTime = now;
    camera.position.z = cameraDepthRef.current;
    if (autoRotateRef.current) {
      myGlobe.rotation.y -= dt * GLOBE_AUTO_ROTATE_RAD_PER_SEC;
    }
    renderer.render(scene, camera);
    gl.endFrameEXP();
  };

  render();
  setIsGlobeReady(true);
};

type Prepared = {
  scene: THREE.Scene;
  globe: THREE.Object3D<THREE.Object3DEventMap>;
};

function buildGlobeScene(
  pixels: EarthPixelBuffer,
  cities: {
    readonly lat: number;
    readonly lng: number;
    readonly color: "#ffffff";
  }[],
  links: {
    readonly startLat: number;
    readonly startLng: number;
    readonly endLat: number;
    readonly endLng: number;
    readonly color: "#5f65f7";
  }[],
): Prepared {
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

  const globe = new ThreeGlobe()
    .globeMaterial(globeMat)
    .pointsData(cities)
    .pointLat("lat")
    .pointLng("lng")
    .pointColor("color")
    .pointAltitude(0)
    .pointRadius(1)
    .arcsData(links)
    .arcColor("color")
    .arcDashLength(0.4)
    .arcDashGap(4)
    .arcDashAnimateTime(400)
    .arcStroke(0.5)
    .showAtmosphere(true);

  globe.position.set(0, 0, 0);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f0f19);
  const ambientLight = new THREE.AmbientLight(0xffffff, 2.1);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(100, 50, 50);
  directionalLight.target.position.set(0, 0, 0);
  scene.add(directionalLight.target);
  scene.add(directionalLight);
  scene.add(globe);

  return { scene, globe };
}
