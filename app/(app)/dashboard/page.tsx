import { TriangleExclamation } from "@gravity-ui/icons";
import Link from "next/link";
import MapView from "@/components/MapView";
import { formatDistance, withColors } from "@/lib/geo";
import { formatMoney, getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [zonesRes, linksRes, statsRes, recentRes, productsRes, settings] = await Promise.all([
    supabase.from("zones").select("id, name, lat, lng, radius_m").order("created_at"),
    supabase.from("product_zones").select("zone_id, products(name)"),
    supabase.rpc("zone_order_stats"),
    // Map shows the latest orders only; totals come from zone_order_stats.
    supabase.from("orders").select("zone_id, lat, lng").order("created_at", { ascending: false }).limit(500),
    supabase.from("products").select("id, name, quantity").order("quantity"),
    getSettings(supabase),
  ]);
  for (const res of [zonesRes, linksRes, statsRes, recentRes, productsRes]) if (res.error) throw res.error;

  const zones = withColors(zonesRes.data!);
  const links = linksRes.data! as unknown as { zone_id: string; products: { name: string } | null }[];
  const products = productsRes.data!;
  const totalsByZone = new Map(
    (statsRes.data as { zone_id: string; order_count: number; units: number; revenue: number }[]).map((s) => [s.zone_id, s]),
  );
  const productsByZone = new Map<string, string[]>();
  for (const l of links) {
    if (l.products) productsByZone.set(l.zone_id, [...(productsByZone.get(l.zone_id) ?? []), l.products.name]);
  }

  const stats = zones.map((z) => {
    const t = totalsByZone.get(z.id);
    return {
      ...z,
      products: productsByZone.get(z.id) ?? [],
      orderCount: Number(t?.order_count ?? 0),
      units: Number(t?.units ?? 0),
      revenue: Number(t?.revenue ?? 0),
    };
  });
  const colorByZone = Object.fromEntries(zones.map((z) => [z.id, z.color]));
  const points = recentRes.data!.map((o) => ({ lat: o.lat, lng: o.lng, color: colorByZone[o.zone_id] ?? "#94a3b8" }));
  const lowStock = products.filter((p) => p.quantity <= settings.low_stock_threshold);
  const revenue = stats.reduce((sum, z) => sum + z.revenue, 0);
  const orderCount = stats.reduce((sum, z) => sum + z.orderCount, 0);

  const totals = [
    { label: "Zones", value: zones.length, href: "/zones" },
    { label: "Products", value: products.length, href: "/products" },
    { label: "Orders", value: orderCount, href: "/orders" },
    { label: "Revenue", value: formatMoney(revenue, settings.currency), href: "/orders" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {totals.map((t) => (
          <Link key={t.label} href={t.href} className="card transition hover:ring-accent">
            <p className="text-xs font-medium text-muted uppercase">{t.label}</p>
            <p className="mt-1 truncate text-2xl font-semibold tabular-nums">{t.value}</p>
          </Link>
        ))}
      </div>

      {lowStock.length > 0 && (
        <Link href="/products" className="flex items-start gap-3 rounded-3xl bg-warning-soft p-4 text-warning-soft-foreground">
          <TriangleExclamation className="mt-0.5 shrink-0" />
          <span className="text-sm">
            <b>Low stock ({lowStock.length}):</b>{" "}
            {lowStock.map((p) => `${p.name} (${p.quantity})`).join(", ")}. Tap to restock.
          </span>
        </Link>
      )}

      <section className="card space-y-3">
        <h2 className="font-semibold">Zones and orders</h2>
        <MapView zones={zones} points={points} />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">By zone</h2>
        {stats.length === 0 && (
          <p className="text-sm text-muted">
            No zones yet. <Link href="/zones" className="text-accent underline">Create one</Link>.
          </p>
        )}
        <ul className="grid gap-3 sm:grid-cols-2">
          {stats.map((z) => (
            <li key={z.id} className="card space-y-2" style={{ borderLeft: `4px solid ${z.color}` }}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-medium">{z.name}</p>
                <p className="text-xs text-muted">radius {formatDistance(z.radius_m)}</p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                {[
                  ["orders", z.orderCount],
                  ["units", z.units],
                  ["products", z.products.length],
                  [settings.currency, z.revenue.toFixed(0)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-default p-2">
                    <p className="font-semibold tabular-nums">{value}</p>
                    <p className="text-[11px] text-muted">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted">{z.products.length ? z.products.join(", ") : "No products assigned"}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
