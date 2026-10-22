"use client";

import Link from "next/link";
import { useFormAction } from "@/lib/useFormAction";
import { createProduct, setProductZones } from "./actions";

type ZoneOption = { id: string; name: string; color: string };
type Product = { id: string; name: string; price: number; quantity: number; zoneIds: string[] };

function ZoneCheckboxes({ zones, selected = [] }: { zones: ZoneOption[]; selected?: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {zones.map((z) => (
        <label
          key={z.id}
          className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 ring-slate-300 has-[:checked]:bg-indigo-50 has-[:checked]:ring-indigo-500"
        >
          <input type="checkbox" name="zone_ids" value={z.id} defaultChecked={selected.includes(z.id)} className="sr-only" />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: z.color }} />
          {z.name}
        </label>
      ))}
    </div>
  );
}

function ErrorText({ error }: { error?: string }) {
  return error ? <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p> : null;
}

function ProductCard({ product, zones }: { product: Product; zones: ZoneOption[] }) {
  const { state, onSubmit, pending } = useFormAction(setProductZones.bind(null, product.id));
  const assigned = zones.filter((z) => product.zoneIds.includes(z.id));

  return (
    <li className="card space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{product.name}</p>
          <p className="text-sm text-slate-500">{product.price.toFixed(2)} MAD</p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            product.quantity > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {product.quantity} in stock
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {assigned.map((z) => (
          <span key={z.id} className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: z.color }} />
            {z.name}
          </span>
        ))}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-indigo-600">Edit zones</summary>
        <form onSubmit={onSubmit} className="mt-2 space-y-2">
          <ZoneCheckboxes zones={zones} selected={product.zoneIds} />
          <ErrorText error={state.error} />
          <button disabled={pending} className="btn-secondary text-sm">
            {pending ? "Saving…" : "Save zones"}
          </button>
        </form>
      </details>
    </li>
  );
}

export default function ProductsClient({ zones, products }: { zones: ZoneOption[]; products: Product[] }) {
  const { state, onSubmit, pending } = useFormAction(createProduct);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Products</h1>

      {zones.length === 0 ? (
        <p className="card text-sm text-slate-600">
          Create a <Link href="/zones" className="text-indigo-600 underline">zone</Link> first, then add products to it.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="card space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              Name
              <input name="name" required className="input mt-1" placeholder="e.g. Water 1.5L" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Price (MAD)
              <input name="price" type="number" min={0} step="0.01" required className="input mt-1" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Quantity
              <input name="quantity" type="number" min={0} step={1} required className="input mt-1" />
            </label>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">Available in zones</legend>
            <ZoneCheckboxes zones={zones} />
          </fieldset>
          <ErrorText error={state.error} />
          <button disabled={pending} className="btn-primary w-full sm:w-auto">
            {pending ? "Saving…" : "Add product"}
          </button>
        </form>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold">All products ({products.length})</h2>
        {products.length === 0 && <p className="text-sm text-slate-500">No products yet.</p>}
        <ul className="grid gap-2 sm:grid-cols-2">
          {products.map((p) => (
            <ProductCard key={p.id + p.zoneIds.join()} product={p} zones={zones} />
          ))}
        </ul>
      </section>
    </div>
  );
}
