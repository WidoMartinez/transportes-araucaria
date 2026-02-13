import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { LogOut, User, Shield, Bell } from "lucide-react";
import AdminSidebar from "./admin/layout/AdminSidebar";
import DashboardHome from "./admin/dashboard/DashboardHome";
import GestionPromociones from "./admin/dashboard/GestionPromociones";
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
import AdminBloqueosAgenda from "./AdminBloqueosAgenda";
import AdminUsuarios from "./AdminUsuarios";
import AdminPerfil from "./AdminPerfil";
import AdminConfiguracion from "./AdminConfiguracion";

/**
 * Panel de Administración Principal
 * Versión 2.0 - Reorganizado con navegación lateral y dashboard
 */
function AdminDashboard() {
  const { user, logout } = useAuth();
  
  // Estado del panel activo (con soporte legacy para URL params)
  const [active, setActive] = useState(() => {
    const url = new URL(window.location.href);
    const panelParam = url.searchParams.get("panel");
    // Si no hay panel, mostrar dashboard por defecto
    return panelParam || "dashboard";
  });

  // Estado del sidebar colapsado
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Cambiar panel activo
  const setPanel = (panel) => {
    const u = new URL(window.location.href);
    if (panel === "dashboard") {
      u.searchParams.delete("panel");
    } else {
      u.searchParams.set("panel", panel);
    }
    window.history.replaceState({}, "", u.toString());
    setActive(panel);
  };

  // Cerrar sesión
  const handleLogout = () => {
    if (confirm("¿Está seguro que desea cerrar sesión?")) {
      logout();
    }
  };

  // Toggle sidebar colapsado
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar de navegación */}
      <AdminSidebar 
        activePanel={active}
        onPanelChange={setPanel}
        userRole={user?.rol}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header con información de usuario */}
        <header className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Panel Administrativo</h1>
              <p className="text-sm text-gray-500">Transportes Araucaria</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Botón de notificaciones (futuro) */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  0
                </span>
              </Button>

              {/* Información del usuario */}
              {user && (
                <div className="flex items-center gap-3 border-l pl-4">
                  <div className="text-right">
                    <p className="font-medium text-sm">{user.nombre}</p>
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Shield className="h-3 w-3" />
                      <span className="capitalize">{user.rol}</span>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-chocolate-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-chocolate-600" />
                  </div>
                </div>
              )}

              {/* Botón de cerrar sesión */}
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
        </header>

        {/* Área de contenido */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className={`
            ${["reservas", "vehiculos", "conductores", "gastos", "estadisticas", "productos", "tarifa-dinamica", "disponibilidad", "festivos", "usuarios"].includes(active) ? "max-w-full" : "max-w-7xl mx-auto"} 
            px-6 py-6
          `}>
            {/* Renderizar el componente activo */}
            {active === "dashboard" ? (
              <DashboardHome onNavigate={setPanel} />
            ) : active === "reservas" ? (
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
            ) : active === "bloqueos" ? (
              <AdminBloqueosAgenda />
            ) : active === "promociones" ? (
              <GestionPromociones />
            ) : active === "codigos" ? (
              <AdminCodigos />
            ) : active === "codigos-mejorado" ? (
              <AdminCodigosMejorado />
            ) : active === "codigos-pago" ? (
              <AdminCodigosPago />
            ) : active === "pricing" ? (
              <AdminPricing />
            ) : active === "usuarios" ? (
              <AdminUsuarios />
            ) : active === "perfil" ? (
              <AdminPerfil />
            ) : active === "configuracion" ? (
              <AdminConfiguracion />
            ) : (
              // Fallback al dashboard si el panel no existe
              <DashboardHome onNavigate={setPanel} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
