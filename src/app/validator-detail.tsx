import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Image, ScrollView, Text, View } from "react-native";

import { EpochRow } from "@/features/validators/components";
import { validatorsGeoQueryOptions, validatorsQueryOptions } from "@/features/validators/services";
import {
  commissionDisplayRate,
  commissionPercentFromIotaRate,
  formatNanoIota,
  formatPoolTokenFromRaw,
  formatStakeFromRaw,
  geoLine,
  votingPowerPercent,
  type ValidatorRpcFields,
} from "@/features/validators/utils";

export default function ValidatorDetailScreen() {
  const { item } = useLocalSearchParams<{ item: string }>();

  const validator = JSON.parse(item) as ValidatorRpcFields;

  const systemQuery = useQuery({ ...validatorsQueryOptions(), enabled: true });
  const geoQuery = useQuery(validatorsGeoQueryOptions(systemQuery.data ?? null));

  const geoEntry = useMemo(
    () => geoQuery.data?.find((g) => g.iotaAddress === validator?.iotaAddress),
    [geoQuery.data, validator?.iotaAddress],
  );

  const currentEpochStr = systemQuery?.data?.epoch ? Number(systemQuery?.data?.epoch) : undefined;
  const nextEpochStr = currentEpochStr ? +currentEpochStr + 1 : undefined;

  if (!validator) {
    return (
      <>
        <Stack.Screen options={{ title: "Validator" }} />
        <View className="flex-1 items-center justify-center bg-bg px-6">
          <Text className="text-center text-base text-text">
            Could not load validator details. Go back and open the validator again from the list.
          </Text>
        </View>
      </>
    );
  }

  const baseCommission = commissionPercentFromIotaRate(validator.commissionRate);
  const effective = commissionDisplayRate(validator);
  const showBothCommissions =
    validator.effectiveCommissionRate != null &&
    String(validator.effectiveCommissionRate).trim() !== "" &&
    commissionPercentFromIotaRate(String(validator.effectiveCommissionRate)) !== baseCommission;

  const geoText = geoLine(geoEntry);

  const currentEpochRows: { label: string; value: string }[] = [
    { label: "Stake (pool IOTA)", value: formatStakeFromRaw(validator.stakingPoolIotaBalance) },
    { label: "Voting power", value: votingPowerPercent(validator.votingPower) },
    { label: "Commission (effective)", value: effective },
    ...(showBothCommissions
      ? [{ label: "Commission (configured)", value: baseCommission } as const]
      : []),
    { label: "Gas price", value: formatNanoIota(validator.gasPrice) },
    { label: "Pool token supply", value: formatPoolTokenFromRaw(validator.poolTokenBalance) },
    { label: "Rewards pool", value: formatStakeFromRaw(validator.rewardsPool) },
    { label: "Pending stake", value: formatStakeFromRaw(validator.pendingStake) },
    {
      label: "Pending pool token withdraw",
      value: formatPoolTokenFromRaw(validator.pendingPoolTokenWithdraw),
    },
    {
      label: "Pending IOTA withdraw",
      value: formatStakeFromRaw(validator.pendingTotalIotaWithdraw),
    },
    {
      label: "Pool activated",
      value:
        validator.stakingPoolActivationEpoch != null && validator.stakingPoolActivationEpoch !== ""
          ? `Epoch ${validator.stakingPoolActivationEpoch}`
          : "—",
    },
    {
      label: "Pool deactivated",
      value:
        validator.stakingPoolDeactivationEpoch != null &&
        validator.stakingPoolDeactivationEpoch !== ""
          ? `Epoch ${validator.stakingPoolDeactivationEpoch}`
          : "—",
    },
  ];

  const nextEpochRows: { label: string; value: string }[] = [
    { label: "Stake", value: formatStakeFromRaw(validator.nextEpochStake) },
    {
      label: "Commission",
      value: commissionPercentFromIotaRate(validator.nextEpochCommissionRate),
    },
    { label: "Gas price", value: formatNanoIota(validator.nextEpochGasPrice) },
  ];

  return (
    <>
      <Stack.Screen options={{ title: validator.name || "Validator" }} />
      <ScrollView
        className="flex-1 bg-bg"
        contentContainerClassName="gap-4 px-4 pt-4 pb-8"
        contentInsetAdjustmentBehavior="automatic">
        <View className="gap-3 bg-card p-4 rounded-3xl">
          <View className="flex-row gap-3">
            <Image
              source={{ uri: validator.imageUrl }}
              className="size-16 rounded-2xl bg-surface"
            />
            <View className="min-w-0 shrink flex-1 gap-1">
              <Text className="text-xl font-semibold text-amber-100" numberOfLines={2}>
                {validator.name}
              </Text>
              {geoText ? (
                <Text className="text-sm leading-snug text-primary" numberOfLines={3}>
                  {geoText}
                </Text>
              ) : geoQuery.isPending ? (
                <Text className="text-sm text-tab-inactive">Resolving location…</Text>
              ) : null}
            </View>
          </View>
          {validator.description ? (
            <Text className="text-sm leading-relaxed text-text" selectable>
              {validator.description}
            </Text>
          ) : (
            <Text className="text-sm italic text-tab-inactive">No description</Text>
          )}
        </View>

        <View className="gap-3 bg-card p-4 rounded-3xl">
          <View className="gap-0.5">
            <Text className="text-xs uppercase tracking-wide text-tab-inactive">Current epoch</Text>
            {currentEpochStr ? (
              <Text className="text-lg font-semibold text-amber-100">Epoch {currentEpochStr}</Text>
            ) : (
              <Text className="text-lg font-semibold text-amber-100">Epoch —</Text>
            )}
          </View>
          <View className="gap-3 border-t border-white/10 pt-3">
            {currentEpochRows.map((row) => (
              <EpochRow key={row.label} row={row} />
            ))}
          </View>
        </View>

        <View className="gap-3 bg-card p-4 rounded-3xl">
          <View className="gap-0.5">
            <Text className="text-xs uppercase tracking-wide text-tab-inactive">Next epoch</Text>
            {nextEpochStr ? (
              <Text className="text-lg font-semibold text-amber-100">Epoch {nextEpochStr}</Text>
            ) : (
              <Text className="text-lg font-semibold text-amber-100">Epoch —</Text>
            )}
          </View>
          <View className="gap-3 border-t border-white/10 pt-3">
            {nextEpochRows.map((row) => (
              <EpochRow key={row.label} row={row} />
            ))}
          </View>
        </View>

        <View className="gap-3 bg-card p-4 rounded-3xl">
          <Text className="text-xs uppercase tracking-wide text-tab-inactive">
            On-chain references
          </Text>
          <View className="gap-4 border-t border-white/10 pt-3">
            <View className="gap-1">
              <Text className="text-xs uppercase tracking-wide text-tab-inactive">Address</Text>
              <Text className="text-sm font-medium text-amber-200">{validator.iotaAddress}</Text>
            </View>
            <View className="gap-1">
              <Text className="text-xs uppercase tracking-wide text-tab-inactive">Pool ID</Text>
              <Text className="text-sm font-medium text-amber-200">{validator.stakingPoolId}</Text>
            </View>
            <View className="gap-1">
              <Text className="text-xs uppercase tracking-wide text-tab-inactive">Public key</Text>
              <Text className="text-sm font-medium text-amber-200">
                {validator.protocolPubkeyBytes}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
