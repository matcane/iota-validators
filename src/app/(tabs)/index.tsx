import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useIsFocused } from "@react-navigation/native";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { GLView } from "expo-gl";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { LinearTransition, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResolveClassNames } from "uniwind";

import { onContextCreate } from "@/features/globe";
import { GlobeBadge } from "@/features/globe/components";
import { useGlobeRotation } from "@/features/globe/hooks";
import { EpochRow } from "@/features/validators/components";
import {
  latestCheckpointQueryOptions,
  validatorsGeoQueryOptions,
  validatorsQueryOptions,
} from "@/features/validators/services";
import { useHistoryStore } from "@/features/validators/store";

const CHECKPOINT_QUERY_DEBOUNCE_MS = 1000;
const GLOBE_LINK_COUNT = 15;

type GlobeLink = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: "#5f65f7";
};

export default function HomeTab() {
  const insets = useSafeAreaInsets();
  const bottomTabHeight = useBottomTabBarHeight();

  const activityColor = useResolveClassNames("text-primary").color;
  const isFocused = useIsFocused();
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [checkpointQueryEnabled, setCheckpointQueryEnabled] = useState(false);

  const { autoRotateRef, cameraDepthRef, globeGestures, globeObjRef } = useGlobeRotation();

  useEffect(() => {
    if (!isFocused) {
      setIsGlobeReady(false);
      globeObjRef.current = null;
    }
  }, [globeObjRef, isFocused]);

  useEffect(() => {
    if (!isFocused || !isGlobeReady) {
      setCheckpointQueryEnabled(false);
      return;
    }
    const id = setTimeout(() => setCheckpointQueryEnabled(true), CHECKPOINT_QUERY_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [isFocused, isGlobeReady]);

  const systemQuery = useSuspenseQuery(validatorsQueryOptions());
  const geoQuery = useQuery(validatorsGeoQueryOptions(systemQuery.data ?? null));

  const countriesCount = new Set(geoQuery.data?.map((item) => item.geo?.country));
  const citiesCount = new Set(geoQuery.data?.map((item) => item.geo?.city));

  const cities = useMemo(
    () =>
      Array.from(
        new Map(
          (geoQuery.data ?? []).flatMap((item) => {
            const geo = item.geo;
            if (!geo) return [];
            const { latitude, longitude } = geo;
            const key = `${latitude},${longitude}`;
            return [[key, { lat: latitude, lng: longitude, color: "#ffffff" }] as const];
          }),
        ).values(),
      ),
    [geoQuery.data],
  );

  const validatorCount = systemQuery.data?.committeeMembers.length ?? 0;

  useQuery({
    ...latestCheckpointQueryOptions(!!systemQuery.data, !!geoQuery.data),
    enabled: checkpointQueryEnabled,
  });

  const links = useMemo((): GlobeLink[] => {
    if (cities.length < 2) return [];
    const out: GlobeLink[] = [];
    for (let k = 0; k < GLOBE_LINK_COUNT; k++) {
      let i = Math.floor(Math.random() * cities.length);
      let j = Math.floor(Math.random() * cities.length);
      while (j === i) j = Math.floor(Math.random() * cities.length);
      const start = cities[i]!;
      const end = cities[j]!;
      out.push({
        startLat: start.lat,
        startLng: start.lng,
        endLat: end.lat,
        endLng: end.lng,
        color: "#5f65f7",
      });
    }
    return out;
  }, [cities]);

  const history = useHistoryStore((state) => state.history);

  return (
    <ScrollView contentContainerClassName="grow bg-bg pb-2">
      {isFocused && (
        <GestureDetector gesture={globeGestures}>
          <View className="w-full h-full">
            <GLView
              className="flex-1"
              onContextCreate={(gl) =>
                onContextCreate({
                  gl,
                  refs: { globeObjRef, autoRotateRef, cameraDepthRef },
                  callbacks: { setIsGlobeReady },
                  data: { cities, links },
                })
              }
            />
            {!isGlobeReady && (
              <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
                <ActivityIndicator size="large" color={activityColor} />
              </View>
            )}
          </View>
        </GestureDetector>
      )}

      <GlobeBadge position="right" style={{ paddingTop: insets.top }}>
        <EpochRow
          row={{
            label: "Epoch",
            value: systemQuery.data?.epoch != null ? String(systemQuery.data.epoch) : "—",
          }}
        />
        <EpochRow row={{ label: "Validators", value: String(validatorCount) }} />
        <EpochRow row={{ label: "Countries", value: String(countriesCount.size) }} />
        <EpochRow row={{ label: "Cities", value: String(citiesCount.size) }} />
      </GlobeBadge>

      <GlobeBadge position="stretch" style={{ bottom: bottomTabHeight + 16 }}>
        <View className="w-full gap-3">
          <Text className="text-xs uppercase tracking-wide text-tab-inactive">History</Text>
          <Animated.View className="h-10 flex-row gap-1 justify-end overflow-hidden border-t border-white/10 pt-3">
            {history.map((item) => (
              <Animated.View
                key={item.digest}
                layout={LinearTransition.springify().duration(400)}
                entering={ZoomIn.duration(380).springify()}>
                <View
                  className={`h-6 w-2 rounded-sm ${
                    item.status === "success" ? "bg-emerald-400/90" : "bg-rose-500/90"
                  }`}
                />
              </Animated.View>
            ))}
          </Animated.View>
        </View>
      </GlobeBadge>
    </ScrollView>
  );
}
