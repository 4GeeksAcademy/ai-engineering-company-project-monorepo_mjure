"use client";

import { useEffect, useState, type FormEvent } from "react";

import InventoryNav from "@/components/inventory/InventoryNav";
import RequireAuth from "@/components/inventory/RequireAuth";
import { createInboundOrder, listProducts } from "@/lib/inventory";
import type { SKU } from "@/types/inventory";
import styles from "@/app/backoffice/inventory/inventory.module.css";

export default function InboundPage() {
  return (
    <RequireAuth>
      <InboundContent />
    </RequireAuth>
  );
}

function InboundContent() {
  const [products, setProducts] = useState<SKU[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedProduct = products.find((item) => String(item.id) === productId) ?? null;
  useEffect(() => {
    listProducts()
      .then((data) => {
        setProducts(data);

        const preselected = new URLSearchParams(window.location.search).get(
          "productId"
        );

        if (preselected && data.some((item) => String(item.id) === preselected)) {
          setProductId(preselected);
        }
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "No se pudieron cargar los productos")
      );
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedProduct) {
      setError("Seleccioná un producto válido.");
      return;
    }
    setSubmitting(true);

    try {
      await createInboundOrder({
        sku_id: selectedProduct.id,
        quantity: Number(quantity),
        reference: reference.trim(),
        warehouse: selectedProduct.warehouse,
      });

      setSuccess("Entrada registrada correctamente.");
      setProductId("");
      setQuantity("");
      setReference("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la entrada");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <h1>Nueva entrada</h1>
      <p className={styles.muted}>Registrá una entrada real de TrackFlow.</p>
      <InventoryNav />

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>SKU</span>
          <select
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            required
          >
            <option value="">Seleccioná...</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Cantidad</span>
          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Referencia de recepción</span>
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="PO-2024-0098"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Almacén</span>
          <input value={selectedProduct?.warehouse ?? ""} disabled />
        </label>
        <button className={styles.button} disabled={submitting} type="submit">
          {submitting ? "Guardando..." : "Registrar entrada"}
        </button>
      </form>
    </main>
  );
}