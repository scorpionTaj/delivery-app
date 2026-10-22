import { withColors } from "@/lib/geo";
import { getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import OrdersClient from "./OrdersClient";

// Formatted on the server only, so the browser hydrates the exact same text.
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Africa/Casablanca",
});

export default async function OrdersPage() {
  const supabase = await createClient();
  const [zonesRes, productsRes, ordersRes, settings] = await Promise.all([
    supabase.from("zones").select("id, name, lat, lng, radius_m").order("created_at"),
    supabase.from("products").select("id, name, price, quantity, product_zones(zone_id)").order("name"),
    supabase
      .from("orders")
      .select("id, quantity, unit_price, lat, lng, zone_id, created_at, products(name)")
      .order("created_at", { ascending: false })
      .limit(100),
    getSettings(supabase),
  ]);
  if (zonesRes.error) throw zonesRes.error;
  if (productsRes.error) throw productsRes.error;
  if (ordersRes.error) throw ordersRes.error;

  const products = productsRes.data.map((p) => ({
    id: p.id as string,
    name: p.name as string,
    price: Number(p.price),
    quantity: p.quantity as number,
    zoneIds: (p.product_zones as { zone_id: string }[]).map((pz) => pz.zone_id),
  }));

  const orders = ordersRes.data.map((o) => ({
    id: o.id as string,
    quantity: o.quantity as number,
    total: Number(o.unit_price ?? 0) * (o.quantity as number),
    lat: o.lat as number,
    lng: o.lng as number,
    zoneId: o.zone_id as string,
    createdAt: dateFormat.format(new Date(o.created_at as string)),
    createdAtMs: Date.parse(o.created_at as string),
    productName: (o.products as unknown as { name: string } | null)?.name ?? "—",
  }));

  return (
    <OrdersClient
      zones={withColors(zonesRes.data)}
      products={products}
      orders={orders}
      currency={settings.currency}
      maxQuantity={settings.max_order_quantity}
    />
  );
}
