import { useState } from "react";
import AdminPricing from "./AdminPricing";
import AdminCodigos from "./AdminCodigos";
import AdminCodigosMejorado from "./AdminCodigosMejorado";
import AdminReservas from "./AdminReservas";
import AdminVehiculos from "./AdminVehiculos";
import AdminConductores from "./AdminConductores";
import AdminCodigosPago from "./AdminCodigosPago";

function AdminDashboard() {
  const [active, setActive] = useState(() => {
    const url = new URL(window.location.href);
    return url.searchParams.get("panel") || "pricing";
  });

  const setPanel = (panel) => {
    const u = new URL(window.location.href);
    if (panel === "pricing") {
      u.searchParams.delete("panel");
    } else {
      u.searchParams.set("panel", panel);
    }
    window.history.replaceState({}, "", u.toString());
    setActive(panel);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className={`${["reservas", "vehiculos", "conductores"].includes(active) ? "w-full" : "max-w-6xl mx-auto"} px-4 py-6`}>
        <h1 className="text-2xl font-semibold mb-4">Panel Administrativo</h1>
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            className={`px-3 py-2 rounded border ${active === "reservas" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("reservas")}
          >Reservas</button>
          <button
            className={`px-3 py-2 rounded border ${active === "vehiculos" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("vehiculos")}
          >Vehículos</button>
          <button
            className={`px-3 py-2 rounded border ${active === "conductores" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("conductores")}
          >Conductores</button>
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
            className={`px-3 py-2 rounded border ${active === "codigos-pago" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("codigos-pago")}
          >Códigos de Pago</button>
        </div>

        {active === "reservas" ? (
          <AdminReservas />
        ) : active === "vehiculos" ? (
          <AdminVehiculos />
        ) : active === "conductores" ? (
          <AdminConductores />
        ) : active === "codigos" ? (
          <AdminCodigos />
        ) : active === "codigos-mejorado" ? (
          <AdminCodigosMejorado />
        ) : active === "codigos-pago" ? (
          <AdminCodigosPago />
        ) : (
          <AdminPricing />
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;

