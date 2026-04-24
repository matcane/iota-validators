import type { Checkpoint, LatestIotaSystemStateSummary } from "@iota/iota-sdk/client";
import { queryOptions, skipToken, type UseQueryOptions } from "@tanstack/react-query";

import { iotaClient } from "@/lib/iotaClient";

import { getSystemState, getValidatorsGeo } from "./api";
import { HistoryState } from "./store";
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
            const lastCheckpoint = await iotaClient.getCheckpoint({ id: sequenceNumber });
            const blocks = await iotaClient.multiGetTransactionBlocks({
              digests: lastCheckpoint.transactions,
              options: { showEffects: true },
            });
            const statusByDigest = new Map(
              blocks.map((tx) => [tx.digest, tx.effects?.status.status] as const),
            );
            const txsWithStatus = lastCheckpoint.transactions.map((digest) => ({
              digest,
              status: statusByDigest.get(digest),
            }));

            HistoryState().ingestHistoryStream(txsWithStatus);

            return lastCheckpoint;
          },
          refetchInterval: 3_000,
          staleTime: 0,
        })
      : {
          queryKey: ["latestCheckpoint"],
          queryFn: skipToken,
        }
  ) as UseQueryOptions<Checkpoint>;
}
