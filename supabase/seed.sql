-- Example data: Casablanca delivery zones, a product catalogue and ~150 orders
-- over the last 30 days. Safe to re-run: zones/products are matched by name.
-- Run in Supabase → SQL Editor after schema.sql.

select setseed(0.42); -- reproducible "random" assignments and points

-- Zones (name, center, radius in meters)
insert into zones (name, lat, lng, radius_m)
select v.name, v.lat, v.lng, v.radius_m
from (values
  ('Anfa',            33.5880, -7.6420, 1500),
  ('Gauthier',        33.5930, -7.6280,  900),
  ('Bourgogne',       33.6000, -7.6400, 1000),
  ('Centre-Ville',    33.5960, -7.6190, 1200),
  ('Derb Sultan',     33.5700, -7.6000, 1300),
  ('Californie',      33.5450, -7.6250, 1500),
  ('Hay Hassani',     33.5600, -7.6800, 2200),
  ('Oulfa',           33.5500, -7.6950, 1500),
  ('Sidi Maarouf',    33.5300, -7.6400, 2000),
  ('Ain Sebaa',       33.6050, -7.5400, 2500),
  ('Sidi Bernoussi',  33.6100, -7.5000, 2000),
  ('Mohammedia',      33.6866, -7.3830, 3000)
) as v(name, lat, lng, radius_m)
where not exists (select 1 from zones z where z.name = v.name);

-- Products (name, price, stock). A few are low or out of stock on purpose.
insert into products (name, price, quantity)
select v.name, v.price, v.quantity
from (values
  ('Sparkling Water 1L',       8.00, 120),
  ('Orange Juice 1L',         18.00,  60),
  ('Fresh Milk 1L',            7.50,  80),
  ('Mint Tea 200g',           25.00,  45),
  ('Khobz Bread',              1.50, 200),
  ('Croissant',                4.00,  90),
  ('Olive Oil 1L',            75.00,  25),
  ('Couscous 1kg',            20.00,  40),
  ('Medjool Dates 500g',      45.00,   4),
  ('Coffee Beans 250g',       60.00,  30),
  ('Eggs x12',                22.00,  50),
  ('Yogurt Pack x4',          14.00,  70),
  ('Argan Honey 500g',        90.00,   3),
  ('USB-C Charger',           80.00,  15),
  ('Paracetamol 500mg',       12.00,  35),
  ('Laundry Detergent 3L',    65.00,   0),
  ('Basmati Rice 2kg',        28.00,  55)
) as v(name, price, quantity)
where not exists (select 1 from products p where p.name = v.name);

-- Assign every product to 3–7 random zones (existing assignments are kept).
insert into product_zones (product_id, zone_id)
select p.id, z.id
from products p
cross join lateral (
  -- md5(... p.id ...) correlates the subquery so it runs per product.
  select id from zones order by md5(id::text || p.id::text || random()::text) limit 3 + floor(random() * 5)::int
) z
on conflict do nothing;

-- ~150 orders: a random product/zone assignment, a random point inside that
-- zone (uniform over the disc, kept within 90% of the radius), 1–4 units,
-- price snapshot, spread over the last 30 days. Only added once.
insert into orders (product_id, zone_id, quantity, lat, lng, unit_price, created_at)
select
  pz.product_id,
  pz.zone_id,
  1 + floor(random() * 4)::int,
  z.lat + (d * cos(a)) / 111320,
  z.lng + (d * sin(a)) / (111320 * cos(radians(z.lat))),
  p.price,
  now() - random() * interval '30 days'
from generate_series(1, 150)
cross join lateral (
  -- Referencing generate_series makes Postgres re-run this per row.
  select product_id, zone_id from product_zones order by md5(product_id::text || zone_id::text || generate_series::text || random()::text) limit 1
) pz
join zones z on z.id = pz.zone_id
join products p on p.id = pz.product_id
cross join lateral (select random() * 2 * pi() as a, z.radius_m * 0.9 * sqrt(random()) as d) pt
where (select count(*) from orders) < 100;
