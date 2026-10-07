import Link from "next/link";

import styles from "@/app/backoffice/inventory/inventory.module.css";

export default function InventoryNav() {
  return (
    <nav className={styles.nav}>
      <Link href="/backoffice/inventory/products">Productos</Link>
      <Link href="/backoffice/inventory/orders/inbound">Nueva entrada</Link>
      <Link href="/backoffice/inventory/orders/outbound">Nueva salida</Link>
      <Link href="/backoffice/inventory/orders">Historial</Link>
    </nav>
  );
}