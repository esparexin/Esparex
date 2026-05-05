import { z } from "zod";
import { GeoJSONPoint } from "../types/location";

const coordsTupleSchema = z.tuple([z.number(), z.number()]);
const latLngSchema = z.object({ lat: z.number(), lng: z.number() });

export const isValidLongitude = (v: unknown): v is number =>
  typeof v === "number" && v >= -180 && v <= 180;

export const isValidLatitude = (v: unknown): v is number =>
  typeof v === "number" && v >= -90 && v <= 90;

export const isValidLngLat = (lng: unknown, lat: unknown): lng is number =>
  isValidLongitude(lng) &&
  isValidLatitude(lat) &&
  !(lng === 0 && lat === 0);

export const toGeoPoint = (input: unknown): GeoJSONPoint => {
  if (!input) throw new Error("ERR_GEO_01: Input cannot be null");

  if (typeof input !== "object") throw new Error("ERR_GEO_02: Input must be an object");

  const obj = input as Record<string, unknown>;

  // GeoJSON case
  if (
    obj.type === "Point" &&
    Array.isArray(obj.coordinates) &&
    isValidLngLat(obj.coordinates[0], obj.coordinates[1])
  ) {
    return {
      type: "Point",
      coordinates: [Number(obj.coordinates[0]), Number(obj.coordinates[1])],
    };
  }

  // lat/lng object case
  const parsed = latLngSchema.safeParse(input);
  if (parsed.success) {
    if (!isValidLngLat(parsed.data.lng, parsed.data.lat)) {
      throw new Error("ERR_GEO_03: Invalid coordinates range");
    }
    return {
      type: "Point",
      coordinates: [parsed.data.lng, parsed.data.lat],
    };
  }

  // tuple case
  const tuple = coordsTupleSchema.safeParse(input);
  if (tuple.success) {
    if (!isValidLngLat(tuple.data[0], tuple.data[1])) {
      throw new Error("ERR_GEO_03: Invalid coordinates range");
    }
    return {
      type: "Point",
      coordinates: [tuple.data[0], tuple.data[1]],
    };
  }

  throw new Error("ERR_GEO_04: Unrecognized location format");
};

/**
 * Calculates the Haversine distance between two points in kilometers.
 */
export const haversineDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
