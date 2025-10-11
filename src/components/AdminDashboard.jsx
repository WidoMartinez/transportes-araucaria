import { useMemo } from "react";
import AdminPricing from "./AdminPricing";
import AdminCodigos from "./AdminCodigos";
import AdminCodigosMejorado from "./AdminCodigosMejorado";
import AdminLeads from "./AdminLeads";

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
        <h1 className="text-2xl font-semibold mb-4">Panel Administrativo</h1>
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            className={`px-3 py-2 rounded border ${active === "pricing" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("pricing")}
          >Precios</button>
          <button
            className={`px-3 py-2 rounded border ${active === "codigos" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("codigos")}
          >Códigos</button>
          <button
            className={`px-3 py-2 rounded border ${active === "codigos-mejorado" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("codigos-mejorado")}
          >Códigos (Mejorado)</button>
          <button
            className={`px-3 py-2 rounded border ${active === "leads" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("leads")}
          >Leads Remarketing</button>
          <a
            className="px-3 py-2 rounded border bg-white"
            href="/reservas_manager.php"
            target="_blank"
            rel="noreferrer noopener"
          >Reservas (PHP)</a>
        </div>

        {active === "codigos" ? (
          <AdminCodigos />
        ) : active === "codigos-mejorado" ? (
          <AdminCodigosMejorado />
        ) : active === "leads" ? (
          <AdminLeads />
        ) : (
          <AdminPricing />
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;

