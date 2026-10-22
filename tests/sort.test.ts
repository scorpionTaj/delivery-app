import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { sortOrders, sortProducts, sortZones } from "../lib/sort.ts";

const names = (list: { name: string }[]) => list.map((x) => x.name);

describe("sortZones", () => {
  const zones = [
    { name: "Maarif", radius_m: 2500 },
    { name: "anfa", radius_m: 1500 },
    { name: "Hay Mohammadi", radius_m: 5000 },
    { name: "Bourgogne", radius_m: 1500 },
  ];

  test("radius largest → smallest, ties by name", () => {
    assert.deepEqual(names(sortZones(zones, "radius-desc")), ["Hay Mohammadi", "Maarif", "anfa", "Bourgogne"]);
  });
  test("radius smallest → largest", () => {
    assert.deepEqual(names(sortZones(zones, "radius-asc")), ["anfa", "Bourgogne", "Maarif", "Hay Mohammadi"]);
  });
  test("name, case-insensitive", () => {
    assert.deepEqual(names(sortZones(zones, "name")), ["anfa", "Bourgogne", "Hay Mohammadi", "Maarif"]);
  });
  test("does not mutate the input", () => {
    const copy = structuredClone(zones);
    sortZones(zones, "radius-desc");
    assert.deepEqual(zones, copy);
  });
});

describe("sortProducts", () => {
  const products = [
    { name: "Honey", price: 90, quantity: 3 },
    { name: "Detergent", price: 65, quantity: 0 },
    { name: "Bread", price: 1.5, quantity: 200 },
    { name: "Dates", price: 45, quantity: 0 },
  ];

  test("stock most → least, out of stock last", () => {
    assert.deepEqual(names(sortProducts(products, "stock-desc")), ["Bread", "Honey", "Dates", "Detergent"]);
  });
  test("stock: out of stock first, then lowest", () => {
    assert.deepEqual(names(sortProducts(products, "stock-asc")), ["Dates", "Detergent", "Honey", "Bread"]);
  });
  test("price both directions", () => {
    assert.deepEqual(names(sortProducts(products, "price-desc")), ["Honey", "Detergent", "Dates", "Bread"]);
    assert.deepEqual(names(sortProducts(products, "price-asc")), ["Bread", "Dates", "Detergent", "Honey"]);
  });
});

describe("sortOrders", () => {
  const orders = [
    { id: "a", createdAtMs: 1000, total: 50, quantity: 1 },
    { id: "b", createdAtMs: 3000, total: 10, quantity: 4 },
    { id: "c", createdAtMs: 2000, total: 90, quantity: 2 },
  ];
  const ids = (list: { id: string }[]) => list.map((o) => o.id);

  test("newest / oldest", () => {
    assert.deepEqual(ids(sortOrders(orders, "newest")), ["b", "c", "a"]);
    assert.deepEqual(ids(sortOrders(orders, "oldest")), ["a", "c", "b"]);
  });
  test("by total and by quantity", () => {
    assert.deepEqual(ids(sortOrders(orders, "total-desc")), ["c", "a", "b"]);
    assert.deepEqual(ids(sortOrders(orders, "quantity-desc")), ["b", "c", "a"]);
  });
});
