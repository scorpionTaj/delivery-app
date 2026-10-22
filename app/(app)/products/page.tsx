import { withColors } from "@/lib/geo";
import { createClient } from "@/lib/supabase/server";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
  const supabase = await createClient();
  const [zonesRes, productsRes] = await Promise.all([
    supabase.from("zones").select("id, name").order("created_at"),
    supabase
      .from("products")
      .select("id, name, price, quantity, product_zones(zone_id)")
      .order("created_at", { ascending: false }),
  ]);
  if (zonesRes.error) throw zonesRes.error;
  if (productsRes.error) throw productsRes.error;

  const products = productsRes.data.map((p) => ({
    id: p.id as string,
    name: p.name as string,
    price: Number(p.price),
    quantity: p.quantity as number,
    zoneIds: (p.product_zones as { zone_id: string }[]).map((pz) => pz.zone_id),
  }));

  return <ProductsClient zones={withColors(zonesRes.data)} products={products} />;
}
