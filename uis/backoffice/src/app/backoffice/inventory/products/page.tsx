"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import InventoryNav from "@/components/inventory/InventoryNav";
import RequireAuth from "@/components/inventory/RequireAuth";
import { listProducts } from "@/lib/inventory";
import type { SKU } from "@/types/inventory";
import styles from "@/app/backoffice/inventory/inventory.module.css";

// Umbrales visuales del hito.
// <= 5: bajo | <= 15: atención | > 15: saludable.
// Son indicadores de UI, no reglas de negocio del backend.
function stockClass(stock: number) {
  if (stock <= 5) return `${styles.badge} ${styles.low}`;
  if (stock <= 15) return `${styles.badge} ${styles.warning}`;
  return `${styles.badge} ${styles.healthy}`;
}

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
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>SKU</th>
      <th>SKU</th>
      <th>Cliente</th>
      <th>Categoría</th>
      <th>Almacén</th>
                <th>Stock actual</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
          <td>{product.sku}</td>
          <td>{product.client_name}</td>
          <td>{product.category}</td>
          <td>{product.warehouse}</td>
                  <td>
                    <span className={stockClass(product.current_stock)}>
                      {product.current_stock}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link
                        className={styles.actionLink}
                        href={`/backoffice/inventory/orders/inbound?productId=${product.id}`}
                      >
                        Entrada
                      </Link>
                      <Link
                        className={styles.actionLink}
                        href={`/backoffice/inventory/orders/outbound?productId=${product.id}`}
                      >
                        Salida
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}