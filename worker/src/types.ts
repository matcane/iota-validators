export interface RateLimit {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  IOTA_UPSTREAM_URL: string;
  ALLOWED_ORIGINS: string;
  RL_IP: RateLimit;
  RL_DEVICE: RateLimit;
}
