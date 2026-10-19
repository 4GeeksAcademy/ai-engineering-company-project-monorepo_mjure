import Link from "next/link";

import type { SKU } from "@/types/inventory";
import styles from "@/app/backoffice/inventory/inventory.module.css";

function stockClass(stock: number) {
  if (stock <= 5) return `${styles.badge} ${styles.low}`;
  if (stock <= 15) return `${styles.badge} ${styles.warning}`;
  return `${styles.badge} ${styles.healthy}`;
}

export default function ProductsTable({ products }: { products: SKU[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Producto</th>
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
  );
}