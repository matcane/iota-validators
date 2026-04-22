import { iotaClient } from "@/lib/iotaClient";
import { WORKER_URL } from "@/lib/workerUrl";
import { getDeviceId } from "@/services/deviceId";

import type { ValidatorGeoEntry, ValidatorGeoInput, ValidatorsGeoResponse } from "./types";

export async function getValidatorsGeo(input: ValidatorGeoInput): Promise<ValidatorGeoEntry[]> {
  const { epoch, validators } = input;

  const res = await fetch(`${WORKER_URL}/validators-geo`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-device-id": getDeviceId(),
    },
    body: JSON.stringify({ epoch, validators }),
  });
  if (!res.ok) {
    throw new Error(String(res.status));
  }

  const { validatorGeo } = (await res.json()) as ValidatorsGeoResponse;
  return validatorGeo;
}

export async function getSystemState() {
  try {
    const systemState = await iotaClient.getLatestIotaSystemState();
    return systemState;
  } catch (err) {
    console.error("Błąd połączenia (RPC):", err);
  }
}
