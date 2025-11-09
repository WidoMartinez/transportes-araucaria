import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { LogOut, User, Shield } from "lucide-react";
import AdminPricing from "./AdminPricing";
import AdminCodigos from "./AdminCodigos";
import AdminCodigosMejorado from "./AdminCodigosMejorado";
import AdminReservas from "./AdminReservas";
import AdminVehiculos from "./AdminVehiculos";
import AdminConductores from "./AdminConductores";
import AdminCodigosPago from "./AdminCodigosPago";
import AdminGastos from "./AdminGastos";
import AdminEstadisticas from "./AdminEstadisticas";
import AdminProductos from "./AdminProductos";
import AdminTarifaDinamica from "./AdminTarifaDinamica";
import AdminDisponibilidad from "./AdminDisponibilidad";
import AdminFestivos from "./AdminFestivos";
import AdminUsuarios from "./AdminUsuarios";
import AdminPerfil from "./AdminPerfil";

function AdminDashboard() {
  const { user, logout } = useAuth();
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

  const handleLogout = () => {
    if (confirm("¿Está seguro que desea cerrar sesión?")) {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header con información de usuario */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Panel Administrativo</h1>
            <p className="text-sm text-gray-500">Transportes Araucaria</p>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 text-sm">
                <div className="text-right">
                  <p className="font-medium">{user.nombre}</p>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Shield className="h-3 w-3" />
                    <span className="capitalize">{user.rol}</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className={`${["reservas", "vehiculos", "conductores", "gastos", "estadisticas", "productos", "tarifa-dinamica", "disponibilidad", "festivos", "usuarios", "perfil"].includes(active) ? "w-full" : "max-w-6xl mx-auto"} px-4 py-6`}>
        <h2 className="text-xl font-semibold mb-4">Gestión</h2>
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
            className={`px-3 py-2 rounded border ${active === "productos" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("productos")}
          >Productos</button>
          <button
            className={`px-3 py-2 rounded border ${active === "gastos" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("gastos")}
          >Gastos</button>
          <button
            className={`px-3 py-2 rounded border ${active === "estadisticas" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("estadisticas")}
          >Estadísticas</button>
          <button
            className={`px-3 py-2 rounded border ${active === "pricing" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("pricing")}
          >Precios</button>
          <button
            className={`px-3 py-2 rounded border ${active === "tarifa-dinamica" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("tarifa-dinamica")}
          >Tarifa Dinámica</button>
          <button
            className={`px-3 py-2 rounded border ${active === "disponibilidad" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("disponibilidad")}
          >Disponibilidad</button>
          <button
            className={`px-3 py-2 rounded border ${active === "festivos" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("festivos")}
          >Festivos</button>
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
          {user?.rol === "superadmin" && (
            <button
              className={`px-3 py-2 rounded border ${active === "usuarios" ? "bg-primary text-primary-foreground" : "bg-white"}`}
              onClick={() => setPanel("usuarios")}
            >Usuarios</button>
          )}
          <button
            className={`px-3 py-2 rounded border ${active === "perfil" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            onClick={() => setPanel("perfil")}
          >Mi Perfil</button>
        </div>

        {active === "reservas" ? (
          <AdminReservas />
        ) : active === "vehiculos" ? (
          <AdminVehiculos />
        ) : active === "conductores" ? (
          <AdminConductores />
        ) : active === "productos" ? (
          <AdminProductos />
        ) : active === "gastos" ? (
          <AdminGastos />
        ) : active === "estadisticas" ? (
          <AdminEstadisticas />
        ) : active === "tarifa-dinamica" ? (
          <AdminTarifaDinamica />
        ) : active === "disponibilidad" ? (
          <AdminDisponibilidad />
        ) : active === "festivos" ? (
          <AdminFestivos />
        ) : active === "codigos" ? (
          <AdminCodigos />
        ) : active === "codigos-mejorado" ? (
          <AdminCodigosMejorado />
        ) : active === "codigos-pago" ? (
          <AdminCodigosPago />
        ) : active === "usuarios" ? (
          <AdminUsuarios />
        ) : active === "perfil" ? (
          <AdminPerfil />
        ) : (
          <AdminPricing />
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
