export type GeoSummary = {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
};

export type ValidatorGeoEntry = {
  iotaAddress: string;
  netAddress: string;
  parsed:
    | { kind: "hostname"; host: string }
    | { kind: "ip4"; ip: string }
    | { kind: "ip6"; ip: string }
    | { kind: "unsupported" };
  geo: GeoSummary | null;
  error?: string;
};

export type ValidatorGeoInput = {
  epoch: string;
  validators: { iotaAddress: string; netAddress: string }[];
};

export type ValidatorsGeoResponse = { validatorGeo: ValidatorGeoEntry[] };
