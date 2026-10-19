import type { StockMovement } from "@/types/inventory";
import styles from "@/app/backoffice/inventory/inventory.module.css";

export default function OrdersTable({ orders }: { orders: StockMovement[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Producto</th>
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
  );
}