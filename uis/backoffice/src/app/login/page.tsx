"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { TOKEN_STORAGE_KEY } from "@/lib/auth";

type LoginResponse = {
  access_token?: string;
  detail?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/backend/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password }),
      });
      const data = (await response.json().catch(() => null)) as LoginResponse | null;

      if (!response.ok || !data?.access_token) {
        throw new Error(data?.detail ?? "No se pudo iniciar sesión.");
      }

      window.localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
      router.replace("/backoffice/inventory/products");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <section className="card">
        <span className="eyebrow">TRACKFLOW</span>
        <h1>Iniciar sesión</h1>
        <form onSubmit={handleSubmit} className="uploadForm">
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        {error && <p className="error" role="alert">{error}</p>}
      </section>
    </main>
  );
}