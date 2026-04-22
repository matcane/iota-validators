import { useQuery } from "@tanstack/react-query";
import { FlatList, Text, View } from "react-native";

import {
  latestCheckpointQueryOptions,
  validatorsGeoQueryOptions,
  validatorsQueryOptions,
} from "@/features/validators/services";

export default function HomeTab() {
  const systemQuery = useQuery(validatorsQueryOptions());
  const geoQuery = useQuery(validatorsGeoQueryOptions(systemQuery.data ?? null));
  const latestCheckpoint = useQuery(
    latestCheckpointQueryOptions(!!systemQuery.data, !!geoQuery.data),
  );

  console.log(!!systemQuery.data);
  console.log(!!geoQuery.data);

  console.log(latestCheckpoint.data);

  if (systemQuery.isPending || geoQuery.isPending) {
    return (
      <View className="grow items-center">
        <Text>Loading</Text>
      </View>
    );
  }

  return (
    <View className="grow items-center">
      <FlatList
        data={geoQuery.data}
        renderItem={({ item }) => (
          <View>
            <Text>{JSON.stringify(item, null, 2)}</Text>
          </View>
        )}
      />
    </View>
  );
}
