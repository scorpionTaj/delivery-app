"use client";

import Link from "next/link";
import { useState } from "react";
import Map from "@/components/Map";
import type { Zone } from "@/lib/geo";
import { useFormAction } from "@/lib/useFormAction";
import { placeOrder } from "./actions";

type Product = { id: string; name: string; price: number; quantity: number; zoneIds: string[] };
type Order = {
  id: string;
  quantity: number;
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
}: {
  zones: (Zone & { color: string })[];
  products: Product[];
  orders: Order[];
}) {
  const [productId, setProductId] = useState("");
  const [picked, setPicked] = useState<[number, number] | null>(null);
  const { state, onSubmit, pending } = useFormAction(placeOrder, () => {
    setPicked(null);
    setProductId("");
  });

  const product = products.find((p) => p.id === productId);
  // Show only the zones that deliver the selected product.
  const visibleZones = product ? zones.filter((z) => product.zoneIds.includes(z.id)) : zones;
  const zoneById = Object.fromEntries(zones.map((z) => [z.id, z]));

  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="card text-sm text-slate-600">
          Add a <Link href="/products" className="text-indigo-600 underline">product</Link> first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Orders</h1>

      <form onSubmit={onSubmit} className="card space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
          <label className="text-sm font-medium text-slate-700">
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
                  {p.name} — {p.price.toFixed(2)} MAD ({p.quantity} left)
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Quantity
            <input
              name="quantity"
              type="number"
              min={1}
              max={product?.quantity}
              step={1}
              required
              defaultValue={1}
              className="input mt-1"
            />
          </label>
        </div>

        <p className="text-sm text-slate-600">
          Tap the map to set the customer&apos;s delivery location
          {product && <> — circles show the zones that deliver <b>{product.name}</b></>}.
        </p>
        <Map zones={visibleZones} picked={picked} onPick={(lat, lng) => setPicked([lat, lng])} />
        <input type="hidden" name="lat" value={picked?.[0] ?? ""} />
        <input type="hidden" name="lng" value={picked?.[1] ?? ""} />
        <p className="text-xs text-slate-500">
          {picked ? `Location: ${picked[0].toFixed(5)}, ${picked[1].toFixed(5)}` : "No location selected yet."}
        </p>

        {state.error && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{state.error}</p>}
        {state.ok && state.message && (
          <p role="status" className="rounded-lg bg-green-50 p-2 text-sm text-green-700">{state.message}</p>
        )}
        <button disabled={pending || !picked || !productId} className="btn-primary w-full sm:w-auto">
          {pending ? "Checking…" : "Place order"}
        </button>
      </form>

      <section className="space-y-2">
        <h2 className="font-semibold">Accepted orders ({orders.length})</h2>
        {orders.length === 0 && <p className="text-sm text-slate-500">No orders yet.</p>}
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          {orders.map((o) => {
            const zone = zoneById[o.zoneId];
            return (
              <li key={o.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: zone?.color ?? "#94a3b8" }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {o.quantity} × {o.productName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {zone?.name ?? "Deleted zone"} · {new Date(o.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
