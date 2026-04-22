import { IotaClient, IotaHTTPTransport } from "@iota/iota-sdk/client";

import { WORKER_URL } from "@/lib/workerUrl";
import { getDeviceId } from "@/services/deviceId";

export const iotaClient = new IotaClient({
  transport: new IotaHTTPTransport({
    url: `${WORKER_URL}/rpc`,
    fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set("x-device-id", getDeviceId());
      return fetch(input, { ...init, headers });
    },
  }),
});
