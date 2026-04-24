import { Image, Pressable, Text, View, type PressableProps } from "react-native";

import { commissionDisplayRate, formatStakeFromRaw, type ValidatorRpcFields } from "../utils";

interface ValidatorRowProps extends PressableProps {
  item: ValidatorRpcFields;
}

export function ValidatorRow({ item, onPress }: ValidatorRowProps) {
  return (
    <Pressable className="min-h-48 justify-between bg-card p-4 rounded-3xl" onPress={onPress}>
      <View className="flex-row gap-3">
        <Image source={{ uri: item.imageUrl }} className="size-14 rounded-2xl bg-surface" />
        <View className="min-w-0 shrink flex-1 gap-1">
          <Text className="text-lg font-semibold text-amber-100" numberOfLines={1}>
            {item.name}
          </Text>
          {item.description && (
            <Text className="text-sm leading-snug text-text" numberOfLines={3}>
              {item.description}
            </Text>
          )}
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
          <Text className="text-xs uppercase tracking-wide text-tab-inactive">Commission</Text>
          <Text className="text-base font-medium text-amber-200">
            {commissionDisplayRate(item)}
          </Text>
        </View>
        <View className="min-w-[30%] flex-1 gap-0.5">
          <Text className="text-xs uppercase tracking-wide text-tab-inactive">Voting power</Text>
          <Text className="text-base font-medium text-amber-200">{+item.votingPower / 100} %</Text>
        </View>
      </View>
    </Pressable>
  );
}
