"use client";

import { ShoppingCart } from "@gravity-ui/icons";
import { Button, Card, toast } from "@heroui/react";
import Link from "next/link";
import { useState } from "react";
import Map from "@/components/Map";
import type { Zone } from "@/lib/geo";
import { formatMoney } from "@/lib/settings";
import { useFormAction } from "@/lib/useFormAction";
import { placeOrder } from "./actions";

type Product = { id: string; name: string; price: number; quantity: number; zoneIds: string[] };
type Order = {
  id: string;
  quantity: number;
  total: number;
  lat: number;
  lng: number;
  zoneId: string;
  createdAt: string;
  productName: string;
};

export default function OrdersClient({
  zones,
  products,
  orders,
  currency,
  maxQuantity,
}: {
  zones: (Zone & { color: string })[];
  products: Product[];
  orders: Order[];
  currency: string;
  maxQuantity: number;
}) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [picked, setPicked] = useState<[number, number] | null>(null);
  const [zoneFilter, setZoneFilter] = useState("");
  const { state, onSubmit, pending } = useFormAction(placeOrder, (r) => {
    toast.success(r.message ?? "Order accepted");
    setPicked(null);
    setProductId("");
    setQuantity(1);
  });

  const product = products.find((p) => p.id === productId);
  // Show only the zones that deliver the selected product.
  const visibleZones = product ? zones.filter((z) => product.zoneIds.includes(z.id)) : zones;
  const zoneById = Object.fromEntries(zones.map((z) => [z.id, z]));
  const listed = zoneFilter ? orders.filter((o) => o.zoneId === zoneFilter) : orders;
  const points = listed.map((o) => ({ lat: o.lat, lng: o.lng, color: zoneById[o.zoneId]?.color ?? "#94a3b8" }));

  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="card text-sm text-muted">
          Add a <Link href="/products" className="text-accent underline">product</Link> first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Orders</h1>

      <Card>
        <Card.Header>
          <Card.Title>New order</Card.Title>
          <Card.Description>
            Pick a product, then tap the customer&apos;s location
            {product && <> (circles show the zones that deliver <b>{product.name}</b>)</>}.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
              <label className="label">
                Product
                <select
                  name="product_id"
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="input mt-1"
                >
                  <option value="">Choose a product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                      {p.name} — {formatMoney(p.price, currency)} ({p.quantity} left)
                    </option>
                  ))}
                </select>
              </label>
              <label className="label">
                Quantity
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  max={Math.min(maxQuantity, product?.quantity ?? maxQuantity)}
                  step={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="input mt-1"
                />
              </label>
            </div>

            <Map zones={visibleZones} picked={picked} onPick={(lat, lng) => setPicked([lat, lng])} />
            <input type="hidden" name="lat" value={picked?.[0] ?? ""} />
            <input type="hidden" name="lng" value={picked?.[1] ?? ""} />

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted">
                {picked ? `Location: ${picked[0].toFixed(5)}, ${picked[1].toFixed(5)}` : "No location selected yet."}
              </span>
              {product && quantity > 0 && (
                <span className="font-medium">Total: {formatMoney(product.price * quantity, currency)}</span>
              )}
            </div>

            {state.error && <p role="alert" className="alert-error">{state.error}</p>}
            <Button type="submit" isPending={pending} isDisabled={!picked || !productId} fullWidth className="sm:w-auto">
              <ShoppingCart />
              {pending ? "Checking zone…" : "Place order"}
            </Button>
          </form>
        </Card.Content>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Accepted orders ({listed.length})</h2>
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            aria-label="Filter by zone"
            className="input max-w-[12rem] py-1.5 text-sm"
          >
            <option value="">All zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
        {listed.length > 0 && (
          <div className="card p-2">
            <Map zones={zoneFilter ? zones.filter((z) => z.id === zoneFilter) : zones} points={points} />
          </div>
        )}
        {listed.length === 0 && <p className="text-sm text-muted">No orders yet.</p>}
        <ul className="divide-y divide-separator overflow-hidden rounded-3xl bg-surface ring-1 ring-border">
          {listed.map((o) => {
            const zone = zoneById[o.zoneId];
            return (
              <li key={o.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: zone?.color ?? "#94a3b8" }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {o.quantity} × {o.productName}
                  </p>
                  <p className="text-xs text-muted">
                    {zone?.name ?? "Deleted zone"} · {o.createdAt}
                  </p>
                </div>
                <span className="shrink-0 font-medium tabular-nums">{formatMoney(o.total, currency)}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
