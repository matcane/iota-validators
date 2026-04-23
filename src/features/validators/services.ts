import type { Checkpoint, LatestIotaSystemStateSummary } from "@iota/iota-sdk/client";
import { queryOptions, skipToken, type UseQueryOptions } from "@tanstack/react-query";

import { iotaClient } from "@/lib/iotaClient";

import { getSystemState, getValidatorsGeo } from "./api";
import type { ValidatorGeoEntry } from "./types";

export function validatorsQueryOptions() {
  return queryOptions({
    queryKey: ["systemState"] as const,
    queryFn: getSystemState,
    staleTime: Infinity,
  });
}

export function validatorsGeoQueryOptions(systemState: LatestIotaSystemStateSummary | null) {
  return (
    systemState
      ? queryOptions({
          queryKey: [
            "validatorsGeo",
            String(systemState.epoch),
            systemState.activeValidators,
          ] as const,
          queryFn: () =>
            getValidatorsGeo({
              epoch: String(systemState.epoch),
              validators: systemState.activeValidators.map((validator) => ({
                iotaAddress: validator.iotaAddress,
                netAddress: validator.netAddress,
              })),
            }),
          staleTime: Infinity,
        })
      : {
          queryKey: ["validatorsGeo", "none", []] as const,
          queryFn: skipToken,
        }
  ) as UseQueryOptions<ValidatorGeoEntry[]>;
}

export function latestCheckpointQueryOptions(isSystemState: boolean, isvalidatorsGeo: boolean) {
  return (
    isSystemState && isvalidatorsGeo
      ? queryOptions({
          queryKey: ["latestCheckpoint"],
          queryFn: async () => {
            const sequenceNumber = await iotaClient.getLatestCheckpointSequenceNumber();
            return iotaClient.getCheckpoint({ id: sequenceNumber });
          },
          refetchInterval: 100_000,
          staleTime: 0,
        })
      : {
          queryKey: ["latestCheckpoint"],
          queryFn: skipToken,
        }
  ) as UseQueryOptions<Checkpoint>;
}
