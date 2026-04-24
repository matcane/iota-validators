import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { router, Tabs } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { useResolveClassNames } from "uniwind";

import { ValidatorRow } from "@/features/validators/components/ValidatorRow";
import { validatorsQueryOptions } from "@/features/validators/services";
import type { ValidatorRpcFields } from "@/features/validators/utils";

export default function ValidatorsTab() {
  const bottomTabHeight = useBottomTabBarHeight();
  const [query, setQuery] = useState("");

  const systemQuery = useQuery(validatorsQueryOptions());

  const activityColor = useResolveClassNames("text-primary").color;

  const filteredData = systemQuery.data?.committeeMembers.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  );

  if (systemQuery.isPending) {
    return (
      <View className="bg-bg absolute inset-0 items-center justify-center" pointerEvents="none">
        <ActivityIndicator size="large" color={activityColor} />
      </View>
    );
  }

  const handleValidatorDetail = (item: ValidatorRpcFields) => {
    router.navigate({
      pathname: "/validator-detail",
      params: { item: JSON.stringify(item) },
    });
  };

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
        contentContainerClassName="gap-4 grow bg-bg px-4 pt-4"
        contentContainerStyle={{ paddingBottom: bottomTabHeight }}
        data={filteredData}
        keyExtractor={(item) => item.iotaAddress}
        renderItem={({ item }) => (
          <ValidatorRow item={item} onPress={() => handleValidatorDetail(item)} />
        )}
      />
    </>
  );
}
