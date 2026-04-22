import * as Crypto from "expo-crypto";

import { storage } from "./storage";

const KEY = "device.id";

export function getDeviceId(): string {
  const existing = storage.getString(KEY);
  if (existing) return existing;

  const id = Crypto.randomUUID();
  storage.set(KEY, id);
  return id;
}
