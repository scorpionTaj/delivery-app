"use client";

import { Pencil, Plus, TrashBin } from "@gravity-ui/icons";
import { Button, Card, Chip, toast } from "@heroui/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import SortSelect from "@/components/SortSelect";
import { formatMoney } from "@/lib/settings";
import { PRODUCT_SORTS, type ProductSort, sortProducts } from "@/lib/sort";
import { useFormAction } from "@/lib/useFormAction";
import { createProduct, deleteProduct, updateProduct } from "./actions";

type ZoneOption = { id: string; name: string; color: string };
type Product = { id: string; name: string; price: number; quantity: number; zoneIds: string[] };

function ZoneCheckboxes({ zones, selected = [] }: { zones: ZoneOption[]; selected?: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {zones.map((z) => (
        <label
          key={z.id}
          className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 ring-border transition has-[:checked]:bg-accent-soft has-[:checked]:ring-accent"
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
  return error ? <p role="alert" className="alert-error">{error}</p> : null;
}

function StockChip({ quantity, lowStock }: { quantity: number; lowStock: number }) {
  const color = quantity === 0 ? "danger" : quantity <= lowStock ? "warning" : "success";
  const label = quantity === 0 ? "Out of stock" : quantity <= lowStock ? `Low: ${quantity}` : `${quantity} in stock`;
  return (
    <Chip size="sm" variant="soft" color={color}>
      {label}
    </Chip>
  );
}

function ProductFields({ zones, product, currency }: { zones: ZoneOption[]; product?: Product; currency: string }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="label">
          Price ({currency})
          <input name="price" type="number" min={0} step="0.01" required defaultValue={product?.price} className="input mt-1" />
        </label>
        <label className="label">
          {product ? "Stock (set to restock)" : "Quantity"}
          <input name="quantity" type="number" min={0} step={1} required defaultValue={product?.quantity} className="input mt-1" />
        </label>
      </div>
      <fieldset className="space-y-2">
        <legend className="label">Available in zones</legend>
        <ZoneCheckboxes zones={zones} selected={product?.zoneIds} />
      </fieldset>
    </>
  );
}

function ProductCard({
  product,
  zones,
  currency,
  lowStock,
}: {
  product: Product;
  zones: ZoneOption[];
  currency: string;
  lowStock: number;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, startDelete] = useTransition();
  const { state, onSubmit, pending } = useFormAction(
    updateProduct.bind(null, product.id),
    (r) => {
      toast.success(r.message ?? "Saved");
      setEditing(false);
    },
    { reset: false },
  );
  const assigned = zones.filter((z) => product.zoneIds.includes(z.id));

  return (
    <Card>
      <Card.Header className="flex-row items-start justify-between gap-2">
        <div>
          <Card.Title>{product.name}</Card.Title>
          <Card.Description>{formatMoney(product.price, currency)}</Card.Description>
        </div>
        <StockChip quantity={product.quantity} lowStock={lowStock} />
      </Card.Header>
      <Card.Content className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {assigned.map((z) => (
            <span key={z.id} className="flex items-center gap-1 rounded-full bg-default px-2 py-0.5 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ background: z.color }} />
              {z.name}
            </span>
          ))}
        </div>
        {editing && (
          <form onSubmit={onSubmit} className="space-y-3 border-t border-separator pt-3">
            <ProductFields zones={zones} product={product} currency={currency} />
            <ErrorText error={state.error} />
            <div className="flex gap-2">
              <Button type="submit" size="sm" isPending={pending}>
                Save
              </Button>
              <Button size="sm" variant="tertiary" onPress={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Card.Content>
      {!editing && (
        <Card.Footer className="gap-2">
          <Button size="sm" variant="secondary" onPress={() => setEditing(true)}>
            <Pencil />
            Edit / restock
          </Button>
          <Button
            size="sm"
            variant="ghost"
            isPending={deleting}
            className="text-danger"
            onPress={() => {
              if (!confirm(`Delete ${product.name}?`)) return;
              startDelete(async () => {
                const r = await deleteProduct(product.id);
                if (r.error) toast.danger(r.error);
                else toast.success(r.message ?? "Deleted");
              });
            }}
          >
            <TrashBin />
            Delete
          </Button>
        </Card.Footer>
      )}
    </Card>
  );
}

export default function ProductsClient({
  zones,
  products,
  currency,
  lowStock,
}: {
  zones: ZoneOption[];
  products: Product[];
  currency: string;
  lowStock: number;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ProductSort>("stock-desc");
  const { state, onSubmit, pending } = useFormAction(createProduct, (r) => toast.success(r.message ?? "Added"));
  const q = query.trim().toLowerCase();
  const visible = sortProducts(
    products.filter((p) => p.name.toLowerCase().includes(q)),
    sort,
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Products</h1>

      {zones.length === 0 ? (
        <p className="card text-sm text-muted">
          Create a <Link href="/zones" className="text-accent underline">zone</Link> first, then add products to it.
        </p>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>New product</Card.Title>
          </Card.Header>
          <Card.Content>
            <form onSubmit={onSubmit} className="space-y-3">
              <label className="label block">
                Name
                <input name="name" required className="input mt-1" placeholder="e.g. Water 1.5L" />
              </label>
              <ProductFields zones={zones} currency={currency} />
              <ErrorText error={state.error} />
              <Button type="submit" isPending={pending}>
                <Plus />
                Add product
              </Button>
            </form>
          </Card.Content>
        </Card>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">All products ({products.length})</h2>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="input w-auto min-w-0 flex-1 py-1.5 text-sm sm:max-w-xs"
          />
          <SortSelect value={sort} onChange={setSort} options={PRODUCT_SORTS} />
        </div>
        {visible.length === 0 && <p className="text-sm text-muted">No products found.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((p) => (
            <ProductCard
              key={p.id + p.zoneIds.join() + p.quantity + p.price}
              product={p}
              zones={zones}
              currency={currency}
              lowStock={lowStock}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
