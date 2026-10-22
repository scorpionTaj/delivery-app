// Sorting for the zone, product and order lists. Pure functions (unit-tested):
// they return a new array and never mutate the input, so zone colors (assigned
// by creation order on the server) stay the same whatever the display order.

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

export const ZONE_SORTS = {
  "radius-desc": "Radius: largest first",
  "radius-asc": "Radius: smallest first",
  name: "Name: A → Z",
} as const;
export type ZoneSort = keyof typeof ZONE_SORTS;

export function sortZones<T extends { name: string; radius_m: number }>(zones: T[], sort: ZoneSort): T[] {
  const list = [...zones];
  if (sort === "name") return list.sort(byName);
  const dir = sort === "radius-desc" ? -1 : 1;
  return list.sort((a, b) => dir * (a.radius_m - b.radius_m) || byName(a, b));
}

export const PRODUCT_SORTS = {
  "stock-desc": "Stock: most first (out of stock last)",
  "stock-asc": "Stock: out of stock first",
  "price-desc": "Price: highest first",
  "price-asc": "Price: lowest first",
  name: "Name: A → Z",
} as const;
export type ProductSort = keyof typeof PRODUCT_SORTS;

export function sortProducts<T extends { name: string; price: number; quantity: number }>(
  products: T[],
  sort: ProductSort,
): T[] {
  const list = [...products];
  switch (sort) {
    case "stock-desc":
      return list.sort((a, b) => b.quantity - a.quantity || byName(a, b));
    case "stock-asc":
      return list.sort((a, b) => a.quantity - b.quantity || byName(a, b));
    case "price-desc":
      return list.sort((a, b) => b.price - a.price || byName(a, b));
    case "price-asc":
      return list.sort((a, b) => a.price - b.price || byName(a, b));
    case "name":
      return list.sort(byName);
  }
}

export const ORDER_SORTS = {
  newest: "Newest first",
  oldest: "Oldest first",
  "total-desc": "Total: highest first",
  "quantity-desc": "Quantity: highest first",
} as const;
export type OrderSort = keyof typeof ORDER_SORTS;

export function sortOrders<T extends { createdAtMs: number; total: number; quantity: number }>(
  orders: T[],
  sort: OrderSort,
): T[] {
  const list = [...orders];
  switch (sort) {
    case "newest":
      return list.sort((a, b) => b.createdAtMs - a.createdAtMs);
    case "oldest":
      return list.sort((a, b) => a.createdAtMs - b.createdAtMs);
    case "total-desc":
      return list.sort((a, b) => b.total - a.total || b.createdAtMs - a.createdAtMs);
    case "quantity-desc":
      return list.sort((a, b) => b.quantity - a.quantity || b.createdAtMs - a.createdAtMs);
  }
}
