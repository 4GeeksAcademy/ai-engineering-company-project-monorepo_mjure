"use client";

import { useEffect, useState, type FormEvent } from "react";

import InventoryNav from "@/components/inventory/InventoryNav";
import RequireAuth from "@/components/inventory/RequireAuth";
import {
  createOutboundOrder,
  getProduct,
  InventoryApiError,
  listProducts,
} from "@/lib/inventory";
import type { SKU } from "@/types/inventory";
import styles from "@/app/backoffice/inventory/inventory.module.css";

export default function OutboundPage() {
  return (
    <RequireAuth>
      <OutboundContent />
    </RequireAuth>
  );
}

function OutboundContent() {
  const [products, setProducts] = useState<SKU[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [exitType, setExitType] = useState<"dispatch" | "loss">("dispatch");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [error, setError] = useState("");
  const [quantityError, setQuantityError] = useState("");
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

  useEffect(() => {
    if (!productId) return;

    let active = true;

    getProduct(Number(productId))
      .then((product) => {
        if (active) setCurrentStock(product.current_stock);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setCurrentStock(null);
        setError(err instanceof Error ? err.message : "No se pudo obtener el stock");
      });

    return () => {
      active = false;
    };
  }, [productId]);

  const exceedsStock =
    quantity !== "" &&
    currentStock !== null &&
    Number(quantity) > currentStock;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setQuantityError("");
    setSuccess("");

    if (!selectedProduct) {
      setError("Seleccioná un producto válido.");
      return;
    }
    setSubmitting(true);

    try {
      await createOutboundOrder({
        sku_id: selectedProduct.id,
        quantity: Number(quantity),
        exit_type: exitType,
        tracking_number:
          exitType === "dispatch" ? trackingNumber.trim() : null,
        warehouse: selectedProduct.warehouse,
      });

      setSuccess("Salida registrada correctamente.");
      setProductId("");
      setQuantity("");
      setCurrentStock(null);
      setExitType("dispatch");
      setTrackingNumber("");
    } catch (err: unknown) {
      if (err instanceof InventoryApiError && err.status === 400) {
        setQuantityError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "No se pudo registrar la salida");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <h1>Nueva salida</h1>
      <p className={styles.muted}>El stock se consulta antes de enviar el formulario.</p>
      <InventoryNav />

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>SKU</span>
          <select
            value={productId}
            onChange={(event) => {
              setProductId(event.target.value);
              setCurrentStock(null);
              setQuantityError("");
            }}
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

        {productId && (
          <div className={styles.stockBox}>
            Stock disponible: <strong>{currentStock ?? "consultando..."}</strong>
          </div>
        )}

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

        {exceedsStock && (
          <div className={styles.inlineWarning}>
            La cantidad supera el stock mostrado. La API tiene la validación definitiva.
          </div>
        )}

        {quantityError && <div className={styles.error}>{quantityError}</div>}

        <label className={styles.field}>
          <span>Tipo de salida</span>
          <select
            value={exitType}
            onChange={(event) => {
              const next = event.target.value as "dispatch" | "loss";
              setExitType(next);
              if (next === "loss") setTrackingNumber("");
            }}
          >
            <option value="dispatch">Despacho</option>
            <option value="loss">Pérdida</option>
          </select>
        </label>

        {exitType === "dispatch" && (
          <label className={styles.field}>
            <span>Número de tracking</span>
            <input
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
              required
            />
          </label>
        )}

        <label className={styles.field}>
          <span>Almacén</span>
          <input value={selectedProduct?.warehouse ?? ""} disabled />
        </label>
        <button className={styles.button} disabled={submitting} type="submit">
          {submitting ? "Guardando..." : "Registrar salida"}
        </button>
      </form>
    </main>
  );
}