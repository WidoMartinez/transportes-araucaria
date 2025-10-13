import { useMemo } from "react";
import AdminPricing from "./AdminPricing";
import AdminCodigos from "./AdminCodigos";
import AdminCodigosMejorado from "./AdminCodigosMejorado";
import AdminReservas from "./AdminReservas";
import AdminVehiculos from "./AdminVehiculos";
import AdminConductores from "./AdminConductores";
import AdminTarifaDinamica from "./AdminTarifaDinamica";

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
      <div className={`${active === "reservas" ? "w-full" : "max-w-6xl mx-auto"} px-4 py-6`}>
        <h1 className="text-2xl font-semibold mb-4">Panel Administrativo</h1>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            className={`px-3 py-2 rounded border ${active === "reservas" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("reservas")}
          >Reservas</button>
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
            className={`px-3 py-2 rounded border ${active === "vehiculos" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("vehiculos")}
          >Vehículos</button>
          <button
            className={`px-3 py-2 rounded border ${active === "conductores" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("conductores")}
          >Conductores</button>
          <button
            className={`px-3 py-2 rounded border ${active === "tarifa-dinamica" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("tarifa-dinamica")}
          >Tarifa Dinámica</button>
        </div>

        {active === "reservas" ? (
          <AdminReservas />
        ) : active === "codigos" ? (
          <AdminCodigos />
        ) : active === "codigos-mejorado" ? (
          <AdminCodigosMejorado />
        ) : active === "vehiculos" ? (
          <AdminVehiculos />
        ) : active === "conductores" ? (
          <AdminConductores />
        ) : active === "tarifa-dinamica" ? (
          <AdminTarifaDinamica />
        ) : (
          <AdminPricing />
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;

