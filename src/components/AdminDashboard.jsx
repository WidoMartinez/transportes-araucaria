import { useMemo } from "react";
import AdminPricing from "./AdminPricing";
import AdminCodigos from "./AdminCodigos";
import AdminCodigosMejorado from "./AdminCodigosMejorado";

function AdminDashboard() {
  const url = new URL(window.location.href);
  const currentPanel = url.searchParams.get("panel") || "pricing";

  const setPanel = (panel) => {
    const u = new URL(window.location.href);
    if (panel === "pricing") {
      u.searchParams.delete("panel");
    } else {
      u.searchParams.set("panel", panel);
    }
    window.history.replaceState({}, "", u.toString());
  };

  const active = useMemo(() => currentPanel, [currentPanel]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-6">Panel Administrativo</h1>
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${active === "pricing" ? "bg-primary text-primary-foreground shadow-sm" : "bg-white hover:bg-gray-50 border"}`}
            onClick={() => setPanel("pricing")}
          >Precios</button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${active === "codigos-mejorado" ? "bg-primary text-primary-foreground shadow-sm" : "bg-white hover:bg-gray-50 border"}`}
            onClick={() => setPanel("codigos-mejorado")}
          >Códigos</button>
          <a
            className="px-4 py-2 rounded-lg bg-white hover:bg-gray-50 border font-medium transition-colors"
            href="/reservas_manager.php"
            target="_blank"
            rel="noreferrer noopener"
          >Reservas</a>
        </div>

        {active === "codigos" || active === "codigos-mejorado" ? (
          <AdminCodigosMejorado />
        ) : (
          <AdminPricing />
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;

