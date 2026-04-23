import { useQuery } from "@tanstack/react-query";
import { router, Tabs } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from "react-native";
import { useResolveClassNames } from "uniwind";

import { validatorsGeoQueryOptions, validatorsQueryOptions } from "@/features/validators/services";
import {
  commissionDisplayRate,
  formatStakeFromRaw,
  type ValidatorRpcFields,
} from "@/features/validators/utils";

export default function ValidatorsTab() {
  const [query, setQuery] = useState("");
  const systemQuery = useQuery({ ...validatorsQueryOptions(), enabled: true });
  const geoQuery = useQuery(validatorsGeoQueryOptions(systemQuery.data ?? null));

  const activityColor = useResolveClassNames("text-primary").color;

  const filteredData = systemQuery.data?.committeeMembers.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  );

  if (systemQuery.isPending || geoQuery.isPending) {
    return (
      <View className="bg-bg absolute inset-0 items-center justify-center" pointerEvents="none">
        <ActivityIndicator size="large" color={activityColor} />
      </View>
    );
  }

  return (
    <>
      <Tabs.Screen
        options={{
          headerSearchBarOptions: {
            onChangeText: ({ nativeEvent }) => setQuery(nativeEvent.text),
          },
        }}
      />
      <FlatList
        className="bg-bg"
        contentContainerClassName="gap-4 grow bg-bg px-4 pt-4 pb-[100]"
        data={filteredData}
        keyExtractor={(item) => item.iotaAddress}
        renderItem={({ item }) => {
          const v = item as ValidatorRpcFields;
          return (
            <Pressable
              className="gap-3 bg-card p-4 rounded-3xl"
              onPress={() =>
                router.navigate({
                  pathname: "/validator-detail",
                  params: { item: JSON.stringify(item) },
                })
              }>
              <View className="flex-row gap-3">
                <Image source={{ uri: item.imageUrl }} className="size-14 rounded-2xl bg-surface" />
                <View className="min-w-0 shrink flex-1 gap-1">
                  <Text className="text-lg font-semibold text-amber-100" numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.description ? (
                    <Text className="text-sm leading-snug text-text" numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View className="flex-row flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-3">
                <View className="min-w-[30%] flex-1 gap-0.5">
                  <Text className="text-xs uppercase tracking-wide text-tab-inactive">Stake</Text>
                  <Text className="text-base font-medium text-amber-200">
                    {formatStakeFromRaw(item.stakingPoolIotaBalance)}
                  </Text>
                </View>
                <View className="min-w-[30%] flex-1 gap-0.5">
                  <Text className="text-xs uppercase tracking-wide text-tab-inactive">
                    Commission
                  </Text>
                  <Text className="text-base font-medium text-amber-200">
                    {commissionDisplayRate(v)}
                  </Text>
                </View>
                <View className="min-w-[30%] flex-1 gap-0.5">
                  <Text className="text-xs uppercase tracking-wide text-tab-inactive">
                    Voting power
                  </Text>
                  <Text className="text-base font-medium text-amber-200">
                    {+item.votingPower / 100} %
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </>
  );
}
