"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import InventoryNav from "@/components/inventory/InventoryNav";
import RequireAuth from "@/components/inventory/RequireAuth";
import { listProducts } from "@/lib/inventory";
import type { SKU } from "@/types/inventory";
import styles from "@/app/backoffice/inventory/inventory.module.css";

const ProductsTable = dynamic(
  () => import("@/components/inventory/ProductsTable"),
  { loading: () => <p>Cargando tabla...</p> }
);

export default function ProductsPage() {
  return (
    <RequireAuth>
      <ProductsContent />
    </RequireAuth>
  );
}

function ProductsContent() {
  const [products, setProducts] = useState<SKU[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    listProducts()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar el inventario");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>SKUs</h1>
          <p className={styles.muted}>Inventario actual de TrackFlow.</p>
        </div>
      </div>

      <InventoryNav />

      {loading && <p>Cargando...</p>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <ProductsTable products={products} />
      )}
    </main>
  );
}