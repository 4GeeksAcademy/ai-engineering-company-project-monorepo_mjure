import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="homeHero">
        <div className="homeHeroInner">
          <div className="homeIntro">
            <span className="homeKicker">TRACKFLOW / OPERACIONES</span>
            <h1>Todo en orden.<br />Cada operación, visible.</h1>
            <p>Gestiona inventario y analiza incidencias desde un único espacio de trabajo.</p>
            <div className="homeActions">
              <Link href="/login" className="button homeLoginButton">
                Iniciar sesión
              </Link>
              <Link href="/incidents" className="homeSecondaryLink">
                Analizar incidencias
              </Link>
            </div>
          </div>

          <nav className="homeModules" aria-label="Módulos de TrackFlow">
            <span className="homeModulesLabel">MÓDULOS</span>
            <Link className="homeModule" href="/login">
              <span className="homeModuleNumber">01</span>
              <span className="homeModuleName">Inventario</span>
              <span className="homeModuleAccess">Acceder</span>
            </Link>
            <Link className="homeModule" href="/incidents">
              <span className="homeModuleNumber">02</span>
              <span className="homeModuleName">Incidencias</span>
              <span className="homeModuleAccess">Abrir</span>
            </Link>
          </nav>
        </div>
      </section>

      <section className="homeFooter" aria-label="Descripción del espacio">
        <span>BACKOFFICE TRACKFLOW</span>
        <p>Inventario, operaciones y análisis en un mismo lugar.</p>
      </section>
    </main>
  );
}