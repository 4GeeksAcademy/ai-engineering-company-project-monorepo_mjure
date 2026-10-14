"use client";

import { useEffect, useState } from "react";

import InventoryNav from "@/components/inventory/InventoryNav";
import RequireAuth from "@/components/inventory/RequireAuth";
import { listOrders } from "@/lib/inventory";
import type { StockMovement } from "@/types/inventory";
import styles from "@/app/backoffice/inventory/inventory.module.css";

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersContent />
    </RequireAuth>
  );
}

function OrdersContent() {
  const [orders, setOrders] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    listOrders()
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar el historial");
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
      <h1>Historial de órdenes</h1>
      <p className={styles.muted}>Vista de solo lectura.</p>
      <InventoryNav />

      {loading && <p>Cargando...</p>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Cantidad</th>
                <th>Tipo</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={`${order.movement_type}-${order.id}`}>
                  <td>{order.sku.name}</td>
                  <td>{order.quantity}</td>
                  <td>
                    <span
                      className={`${styles.tag} ${
                        order.movement_type === "inbound"
                          ? styles.inbound
                          : styles.outbound
                      }`}
                    >
                      {order.movement_type === "inbound" ? "Entrada" : "Salida"}
                    </span>
                  </td>
                  <td>{new Date(order.created_at).toLocaleString("es-AR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}