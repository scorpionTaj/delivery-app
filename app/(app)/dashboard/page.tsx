import Link from "next/link";
import Map from "@/components/Map";
import { formatDistance, withColors } from "@/lib/geo";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [zonesRes, linksRes, ordersRes, productsRes] = await Promise.all([
    supabase.from("zones").select("id, name, lat, lng, radius_m").order("created_at"),
    supabase.from("product_zones").select("zone_id, products(name)"),
    supabase.from("orders").select("zone_id, quantity, lat, lng"),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ]);
  for (const res of [zonesRes, linksRes, ordersRes, productsRes]) if (res.error) throw res.error;

  const zones = withColors(zonesRes.data!);
  const links = linksRes.data! as unknown as { zone_id: string; products: { name: string } | null }[];
  const orders = ordersRes.data!;

  const stats = zones.map((z) => {
    const zoneOrders = orders.filter((o) => o.zone_id === z.id);
    return {
      ...z,
      products: links.filter((l) => l.zone_id === z.id && l.products).map((l) => l.products!.name),
      orderCount: zoneOrders.length,
      units: zoneOrders.reduce((sum, o) => sum + o.quantity, 0),
    };
  });
  const colorByZone = Object.fromEntries(zones.map((z) => [z.id, z.color]));
  const points = orders.map((o) => ({ lat: o.lat, lng: o.lng, color: colorByZone[o.zone_id] ?? "#94a3b8" }));

  const totals = [
    { label: "Zones", value: zones.length, href: "/zones" },
    { label: "Products", value: productsRes.count ?? 0, href: "/products" },
    { label: "Orders", value: orders.length, href: "/orders" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {totals.map((t) => (
          <Link key={t.label} href={t.href} className="card text-center hover:ring-indigo-300">
            <p className="text-2xl font-semibold sm:text-3xl">{t.value}</p>
            <p className="text-xs text-slate-500 sm:text-sm">{t.label}</p>
          </Link>
        ))}
      </div>

      <section className="card space-y-2">
        <h2 className="font-semibold">Zones and orders</h2>
        <Map zones={zones} points={points} />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">By zone</h2>
        {stats.length === 0 && (
          <p className="text-sm text-slate-500">
            No zones yet. <Link href="/zones" className="text-indigo-600 underline">Create one</Link>.
          </p>
        )}
        <ul className="grid gap-2 sm:grid-cols-2">
          {stats.map((z) => (
            <li key={z.id} className="card space-y-2" style={{ borderLeft: `4px solid ${z.color}` }}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-medium">{z.name}</p>
                <p className="text-xs text-slate-500">radius {formatDistance(z.radius_m)}</p>
              </div>
              <div className="flex gap-4 text-sm">
                <p>
                  <span className="font-semibold">{z.orderCount}</span> orders
                </p>
                <p>
                  <span className="font-semibold">{z.units}</span> units
                </p>
                <p>
                  <span className="font-semibold">{z.products.length}</span> products
                </p>
              </div>
              <p className="text-xs text-slate-500">
                {z.products.length ? z.products.join(", ") : "No products assigned"}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
