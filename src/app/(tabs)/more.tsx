import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useResolveClassNames } from "uniwind";

import { EpochRow } from "@/features/validators/components";
import { validatorsQueryOptions } from "@/features/validators/services";
import { formatNanoIota, formatStakeFromRaw } from "@/features/validators/utils";

function formatDurationMs(msRaw: string): string {
  const ms = Number(msRaw);
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatEpochStart(msRaw: string): string {
  const ms = Number(msRaw);
  if (!Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function MoreTab() {
  const bottomTabHeight = useBottomTabBarHeight();
  const activityColor = useResolveClassNames("text-primary").color;

  const systemQuery = useQuery(validatorsQueryOptions());

  const networkRows = useMemo(() => {
    const s = systemQuery.data;
    if (!s) return [];

    const atRisk = s.atRiskValidators?.length ?? 0;
    const pendingJoin = Number(s.pendingActiveValidatorsSize ?? "0") || 0;

    const rows: { label: string; value: string }[] = [
      { label: "Epoch", value: s.epoch ?? "—" },
      { label: "Protocol version", value: s.protocolVersion ?? "—" },
      { label: "Reference gas price", value: formatNanoIota(s.referenceGasPrice) },
      { label: "Total IOTA supply", value: formatStakeFromRaw(s.iotaTotalSupply) },
      { label: "Epoch duration", value: formatDurationMs(s.epochDurationMs) },
      { label: "Epoch started", value: formatEpochStart(s.epochStartTimestampMs) },
      { label: "Active validators", value: String(s.activeValidators?.length ?? 0) },
      { label: "Committee validators", value: String(s.committeeMembers?.length ?? 0) },
      {
        label: "Validator count bounds",
        value: `${s.minValidatorCount ?? "—"} … ${s.maxValidatorCount ?? "—"}`,
      },
      { label: "Validators at risk", value: atRisk ? String(atRisk) : "0" },
      { label: "Pending to join (next epoch)", value: String(pendingJoin) },
      { label: "Safe mode", value: s.safeMode ? "Yes" : "No" },
    ];

    return rows;
  }, [systemQuery.data]);

  if (systemQuery.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator size="large" color={activityColor} />
      </View>
    );
  }

  if (systemQuery.isError || !systemQuery.data) {
    return (
      <View className="flex-1 justify-center bg-bg px-6">
        <Text className="text-center text-base text-text">
          Could not load network state. Check your connection and try opening this tab again.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="gap-4 px-4 pt-4"
      contentContainerStyle={{ paddingBottom: bottomTabHeight + 16 }}>
      {systemQuery.data.safeMode ? (
        <View className="rounded-3xl border border-red-500/40 bg-red-950/30 p-4">
          <Text className="text-sm font-medium text-red-300">
            The chain reported safe mode. Advance epoch may have failed; extra fees can accrue until
            it clears.
          </Text>
        </View>
      ) : null}

      <View className="gap-3 bg-card p-4 rounded-3xl">
        <View className="gap-3 border-white/10">
          {networkRows.map((row) => (
            <EpochRow key={row.label} row={row} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
