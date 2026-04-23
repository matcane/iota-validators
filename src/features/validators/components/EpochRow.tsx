import { Text, View } from "react-native";

interface EpochRowProps {
  row: { label: string; value: string };
}

export function EpochRow({ row }: EpochRowProps) {
  return (
    <View className="flex-row items-baseline justify-between gap-3">
      <Text className="max-w-[48%] shrink text-xs uppercase tracking-wide text-tab-inactive">
        {row.label}
      </Text>
      <Text
        className="min-w-0 flex-1 text-right text-sm font-medium text-amber-200"
        numberOfLines={3}
        selectable>
        {row.value}
      </Text>
    </View>
  );
}
