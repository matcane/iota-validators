import { Asset } from "expo-asset";
import { decode } from "jpeg-js";

export type EarthPixelBuffer = {
  width: number;
  height: number;
  data: Uint8Array;
};

let cached: EarthPixelBuffer | null = null;
let inflight: Promise<EarthPixelBuffer> | null = null;

function flipRgbaHeightInPlace(data: Uint8Array, w: number, h: number) {
  const row = w * 4;
  const half = h >> 1;
  for (let y = 0; y < half; y++) {
    const y2 = h - 1 - y;
    const a = y * row;
    const b = y2 * row;
    for (let i = 0; i < row; i++) {
      const t = data[a + i]!;
      data[a + i] = data[b + i]!;
      data[b + i] = t;
    }
  }
}

export function preloadEarthNightPixels(): Promise<EarthPixelBuffer> {
  if (cached) {
    return Promise.resolve(cached);
  }
  if (inflight) {
    return inflight;
  }
  inflight = (async () => {
    try {
      const asset = Asset.fromModule(
        require("@/assets/globe/earth-blue-marble-compressed-small.jpg"),
      );
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      if (!uri) {
        throw new Error("globe: brak localUri dla earth-night.jpg");
      }
      const res = await fetch(uri);
      if (!res.ok) {
        throw new Error(`globe: fetch asset failed ${res.status}`);
      }
      const ab = await res.arrayBuffer();
      const { width, height, data } = decode(new Uint8Array(ab), {
        useTArray: true,
        formatAsRGBA: true,
      });
      const copy = new Uint8Array(data.byteLength);
      copy.set(data);
      flipRgbaHeightInPlace(copy, width, height);
      cached = { width, height, data: copy };
      return cached;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function getEarthNightPixelsIfReady(): EarthPixelBuffer | null {
  return cached;
}
