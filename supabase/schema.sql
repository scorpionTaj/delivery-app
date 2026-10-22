-- Run once in Supabase → SQL Editor.

create table zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat float8 not null,
  lng float8 not null,
  radius_m float8 not null check (radius_m > 0),
  user_id uuid references auth.users default auth.uid(),
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null check (price >= 0),
  quantity int not null check (quantity >= 0),
  user_id uuid references auth.users default auth.uid(),
  created_at timestamptz default now()
);

create table product_zones (
  product_id uuid references products on delete cascade,
  zone_id uuid references zones on delete cascade,
  primary key (product_id, zone_id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products,
  zone_id uuid not null references zones,
  quantity int not null check (quantity > 0),
  lat float8 not null,
  lng float8 not null,
  user_id uuid references auth.users default auth.uid(),
  created_at timestamptz default now()
);

-- RLS: any signed-in user can read and write (shared team workspace).
alter table zones enable row level security;
alter table products enable row level security;
alter table product_zones enable row level security;
alter table orders enable row level security;

create policy "authenticated full access" on zones for all to authenticated using (true) with check (true);
create policy "authenticated full access" on products for all to authenticated using (true) with check (true);
create policy "authenticated full access" on product_zones for all to authenticated using (true) with check (true);
create policy "authenticated full access" on orders for all to authenticated using (true) with check (true);

-- Atomically decrement stock and record the order. The zone itself is chosen
-- server-side (haversine) before calling this; here we re-check the product is
-- assigned to that zone and that stock is sufficient, in one transaction.
create or replace function place_order(
  p_product_id uuid, p_zone_id uuid, p_quantity int, p_lat float8, p_lng float8
) returns uuid
language plpgsql
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not exists (
    select 1 from product_zones where product_id = p_product_id and zone_id = p_zone_id
  ) then
    raise exception 'Product is not available in this zone';
  end if;

  update products set quantity = quantity - p_quantity
  where id = p_product_id and quantity >= p_quantity;
  if not found then
    raise exception 'Not enough stock';
  end if;

  insert into orders (product_id, zone_id, quantity, lat, lng)
  values (p_product_id, p_zone_id, p_quantity, p_lat, p_lng)
  returning id into new_id;
  return new_id;
end;
$$;

-- ── Migration 2: workspace settings + price snapshot on orders ──────────────

create table app_settings (
  id int primary key default 1 check (id = 1),
  currency text not null default 'MAD',
  low_stock_threshold int not null default 5 check (low_stock_threshold >= 0),
  max_order_quantity int not null default 50 check (max_order_quantity > 0),
  zone_strategy text not null default 'nearest' check (zone_strategy in ('nearest', 'smallest')),
  edge_tolerance_m float8 not null default 0 check (edge_tolerance_m >= 0),
  updated_at timestamptz default now()
);
insert into app_settings (id) values (1);
alter table app_settings enable row level security;
create policy "authenticated read" on app_settings for select to authenticated using (true);
create policy "authenticated update" on app_settings for update to authenticated using (true) with check (true);

alter table orders add column unit_price numeric check (unit_price >= 0);
update orders o set unit_price = p.price from products p where p.id = o.product_id;

-- Same as above, but also snapshots the product price onto the order.
create or replace function place_order(
  p_product_id uuid, p_zone_id uuid, p_quantity int, p_lat float8, p_lng float8
) returns uuid
language plpgsql
set search_path = public
as $$
declare
  new_id uuid;
  v_price numeric;
begin
  if not exists (
    select 1 from product_zones where product_id = p_product_id and zone_id = p_zone_id
  ) then
    raise exception 'Product is not available in this zone';
  end if;

  update products set quantity = quantity - p_quantity
  where id = p_product_id and quantity >= p_quantity
  returning price into v_price;
  if not found then
    raise exception 'Not enough stock';
  end if;

  insert into orders (product_id, zone_id, quantity, lat, lng, unit_price)
  values (p_product_id, p_zone_id, p_quantity, p_lat, p_lng, v_price)
  returning id into new_id;
  return new_id;
end;
$$;
