// Pure input parsing for server actions. No I/O, so it is unit-tested directly.

import { CURRENCIES, type Currency, type Settings } from "./settings.ts";

export type Parsed<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (v: string) => UUID.test(v);

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const num = (fd: FormData, key: string) => (fd.get(key) === null || str(fd, key) === "" ? NaN : Number(fd.get(key)));

function parseLatLng(fd: FormData): Parsed<{ lat: number; lng: number }> {
  const lat = num(fd, "lat");
  const lng = num(fd, "lng");
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { error: "Tap the map to set a location." };
  }
  return { data: { lat, lng } };
}

export function parseZone(fd: FormData): Parsed<{ name: string; radius_m: number; lat: number; lng: number }> {
  const name = str(fd, "name");
  const radius_m = num(fd, "radius_m");
  if (!name) return { error: "Zone name is required." };
  if (name.length > 80) return { error: "Zone name is too long." };
  if (!Number.isFinite(radius_m) || radius_m <= 0 || radius_m > 100_000) {
    return { error: "Radius must be between 1 and 100,000 meters." };
  }
  const point = parseLatLng(fd);
  if (!point.data) return { error: "Click the map to set the zone center." };
  return { data: { name, radius_m, ...point.data } };
}

export function parseProduct(
  fd: FormData,
  { requireName }: { requireName: boolean },
): Parsed<{ name: string; price: number; quantity: number; zoneIds: string[] }> {
  const name = str(fd, "name");
  const price = num(fd, "price");
  const quantity = num(fd, "quantity");
  // Only well-formed UUIDs: zone ids are also interpolated into a PostgREST filter.
  const zoneIds = [...new Set(fd.getAll("zone_ids").map(String))].filter(isUuid);

  if (requireName && !name) return { error: "Product name is required." };
  if (name.length > 120) return { error: "Product name is too long." };
  if (!Number.isFinite(price) || price < 0) return { error: "Price must be 0 or more." };
  if (!Number.isInteger(quantity) || quantity < 0) return { error: "Quantity must be a whole number, 0 or more." };
  if (zoneIds.length === 0) return { error: "Assign the product to at least one zone." };
  return { data: { name, price: Math.round(price * 100) / 100, quantity, zoneIds } };
}

export function parseOrder(
  fd: FormData,
  { maxQuantity }: { maxQuantity: number },
): Parsed<{ productId: string; quantity: number; lat: number; lng: number }> {
  const productId = str(fd, "product_id");
  const quantity = num(fd, "quantity");
  if (!isUuid(productId)) return { error: "Choose a product." };
  if (!Number.isInteger(quantity) || quantity <= 0) return { error: "Quantity must be a whole number above 0." };
  if (quantity > maxQuantity) return { error: `Orders are limited to ${maxQuantity} units (see Settings).` };
  const point = parseLatLng(fd);
  if (!point.data) return { error: "Tap the map to set the delivery location." };
  return { data: { productId, quantity, ...point.data } };
}

export function parseSettings(fd: FormData): Parsed<Settings> {
  const currency = str(fd, "currency") as Currency;
  const low_stock_threshold = num(fd, "low_stock_threshold");
  const max_order_quantity = num(fd, "max_order_quantity");
  const zone_strategy = str(fd, "zone_strategy");
  const edge_tolerance_m = num(fd, "edge_tolerance_m");

  if (!CURRENCIES.includes(currency)) return { error: `Currency must be one of ${CURRENCIES.join(", ")}.` };
  if (!Number.isInteger(low_stock_threshold) || low_stock_threshold < 0) {
    return { error: "Low-stock threshold must be a whole number, 0 or more." };
  }
  if (!Number.isInteger(max_order_quantity) || max_order_quantity < 1) {
    return { error: "Max order quantity must be at least 1." };
  }
  if (zone_strategy !== "nearest" && zone_strategy !== "smallest") return { error: "Pick a zone selection rule." };
  if (!Number.isFinite(edge_tolerance_m) || edge_tolerance_m < 0 || edge_tolerance_m > 5000) {
    return { error: "Edge tolerance must be between 0 and 5000 meters." };
  }
  return { data: { currency, low_stock_threshold, max_order_quantity, zone_strategy, edge_tolerance_m } };
}
