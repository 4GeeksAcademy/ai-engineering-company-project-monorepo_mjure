"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import InventoryNav from "@/components/inventory/InventoryNav";
import RequireAuth from "@/components/inventory/RequireAuth";
import { listOrders } from "@/lib/inventory";
import type { StockMovement } from "@/types/inventory";
import styles from "@/app/backoffice/inventory/inventory.module.css";

const OrdersTable = dynamic(
  () => import("@/components/inventory/OrdersTable"),
  { loading: () => <p>Cargando tabla...</p> }
);

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
  const movementSummary = useMemo(
    () =>
      orders.reduce(
        (summary, order) => {
          if (order.movement_type === "inbound") {
            summary.inboundCount += 1;
            summary.inboundUnits += order.quantity;
          } else {
            summary.outboundCount += 1;
            summary.outboundUnits += order.quantity;
          }
          return summary;
        },
        { inboundCount: 0, inboundUnits: 0, outboundCount: 0, outboundUnits: 0 }
      ),
    [orders]
  );

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
        <>
          <p className={styles.muted}>
            Entradas: {movementSummary.inboundCount} ({movementSummary.inboundUnits} unidades) | Salidas: {movementSummary.outboundCount} ({movementSummary.outboundUnits} unidades)
          </p>
          <OrdersTable orders={orders} />
        </>
      )}
    </main>
  );
}