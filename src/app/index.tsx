import { useQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useResolveClassNames } from "uniwind";

import { validatorsGeoQueryOptions, validatorsQueryOptions } from "@/features/validators/services";

export default function IntroScreen() {
  const activityColor = useResolveClassNames("text-primary").color;

  const systemQuery = useQuery(validatorsQueryOptions());
  const geoQuery = useQuery(validatorsGeoQueryOptions(systemQuery.data ?? null));

  if (systemQuery.isPending || geoQuery.isPending) {
    return (
      <View className="flex-1 bg-bg justify-center" pointerEvents="none">
        <ActivityIndicator size="large" color={activityColor} />
      </View>
    );
  }

  return <Redirect href="/(tabs)" />;
}
