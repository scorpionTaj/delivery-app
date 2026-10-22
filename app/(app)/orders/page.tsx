import { withColors } from "@/lib/geo";
import { createClient } from "@/lib/supabase/server";
import OrdersClient from "./OrdersClient";

export default async function OrdersPage() {
  const supabase = await createClient();
  const [zonesRes, productsRes, ordersRes] = await Promise.all([
    supabase.from("zones").select("id, name, lat, lng, radius_m").order("created_at"),
    supabase.from("products").select("id, name, price, quantity, product_zones(zone_id)").order("name"),
    supabase
      .from("orders")
      .select("id, quantity, lat, lng, zone_id, created_at, products(name)")
      .order("created_at", { ascending: false })
      .limit(50),
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
    lat: o.lat as number,
    lng: o.lng as number,
    zoneId: o.zone_id as string,
    createdAt: o.created_at as string,
    productName: (o.products as unknown as { name: string } | null)?.name ?? "—",
  }));

  return <OrdersClient zones={withColors(zonesRes.data)} products={products} orders={orders} />;
}
