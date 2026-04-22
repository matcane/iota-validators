export type ParsedNetAddress =
  | { kind: "hostname"; host: string }
  | { kind: "ip4"; ip: string }
  | { kind: "ip6"; ip: string }
  | { kind: "unsupported" };

export type ValidatorGeoEntry = {
  iotaAddress: string;
  netAddress: string;
  parsed: ParsedNetAddress;
  geo: GeoSummary | null;
  error?: string;
};

export type GeoSummary = {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
};

export type ValidatorsGeoRequestBody = {
  epoch: string;
  validators: { iotaAddress: string; netAddress: string }[];
};
