// src/components/admin/dashboard/DashboardHome.jsx

import { useState, useEffect, useMemo } from "react";
import { 
  Calendar, 
  DollarSign, 
  Car, 
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { getBackendUrl } from "../../../lib/backend";

/**
 * Componente de Dashboard principal del panel administrativo
 * Muestra métricas clave y accesos rápidos
 */
function DashboardHome({ onNavigate }) {
  const [stats, setStats] = useState({
    reservasHoy: 0,
    ingresosMes: 0,
    ocupacion: 0,
    pendientes: 0,
    reservasTotales: 0,
    vehiculosActivos: 0,
    conductoresDisponibles: 0,
    productosVendidos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar estadísticas del dashboard
  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
        
        // Intentar cargar estadísticas desde el backend
        const response = await fetch(`${apiUrl}/api/dashboard/stats`);
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Si el endpoint no existe, usar datos de ejemplo
          console.warn("Endpoint de estadísticas no disponible, usando datos de ejemplo");
          setStats({
            reservasHoy: 12,
            ingresosMes: 4500000,
            ocupacion: 75,
            pendientes: 5,
            reservasTotales: 156,
            vehiculosActivos: 8,
            conductoresDisponibles: 6,
            productosVendidos: 23,
          });
        }
      } catch (err) {
        console.error("Error cargando estadísticas:", err);
        setError("No se pudieron cargar las estadísticas");
        // Usar datos de ejemplo en caso de error
        setStats({
          reservasHoy: 0,
          ingresosMes: 0,
          ocupacion: 0,
          pendientes: 0,
          reservasTotales: 0,
          vehiculosActivos: 0,
          conductoresDisponibles: 0,
          productosVendidos: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, []);

  // Formatear moneda CLP usando useMemo para optimizar
  const formatCurrency = useMemo(() => {
    const formatter = new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    });
    return (value) => formatter.format(value);
  }, []);

  // Componente de tarjeta de KPI
  const KPICard = ({ title, value, icon: Icon, color, trend, trendValue, onClick }) => {
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-5 w-5 ${color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <p className={`text-xs flex items-center gap-1 mt-1 ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
              {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{trendValue}</span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  // Componente de acceso rápido
  const QuickAction = ({ title, description, icon: Icon, onClick, color }) => {
    return (
      <Button
        variant="outline"
        className="h-auto p-4 flex items-start gap-3 hover:bg-gray-50"
        onClick={onClick}
      >
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="text-left">
          <div className="font-medium">{title}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Resumen de operaciones y métricas clave</p>
      </div>

      {/* Alerta si hay error */}
      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Reservas Hoy"
          value={stats.reservasHoy}
          icon={Calendar}
          color="text-blue-600"
          trend="up"
          trendValue="+2 respecto ayer"
          onClick={() => onNavigate("reservas")}
        />
        <KPICard
          title="Ingresos del Mes"
          value={formatCurrency(stats.ingresosMes)}
          icon={DollarSign}
          color="text-green-600"
          trend="up"
          trendValue="+15% vs mes anterior"
          onClick={() => onNavigate("estadisticas")}
        />
        <KPICard
          title="Ocupación"
          value={`${stats.ocupacion}%`}
          icon={Car}
          color="text-orange-600"
          onClick={() => onNavigate("vehiculos")}
        />
        <KPICard
          title="Pendientes"
          value={stats.pendientes}
          icon={Clock}
          color="text-red-600"
          onClick={() => onNavigate("reservas")}
        />
      </div>

      {/* Métricas Secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reservasTotales}</div>
            <p className="text-xs text-gray-500">Este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Vehículos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vehiculosActivos}</div>
            <p className="text-xs text-gray-500">En operación</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Conductores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conductoresDisponibles}</div>
            <p className="text-xs text-gray-500">Disponibles hoy</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productosVendidos}</div>
            <p className="text-xs text-gray-500">Este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Accesos Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accede directamente a las funciones más utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickAction
              title="Nueva Reserva"
              description="Crear una nueva reserva"
              icon={Calendar}
              color="bg-blue-600"
              onClick={() => onNavigate("reservas")}
            />
            <QuickAction
              title="Ver Estadísticas"
              description="Reportes y analytics"
              icon={TrendingUp}
              color="bg-green-600"
              onClick={() => onNavigate("estadisticas")}
            />
            <QuickAction
              title="Gestionar Vehículos"
              description="Control de flota"
              icon={Car}
              color="bg-orange-600"
              onClick={() => onNavigate("vehiculos")}
            />
            <QuickAction
              title="Conductores"
              description="Personal disponible"
              icon={Users}
              color="bg-purple-600"
              onClick={() => onNavigate("conductores")}
            />
            <QuickAction
              title="Productos"
              description="Catálogo y precios"
              icon={Package}
              color="bg-pink-600"
              onClick={() => onNavigate("productos")}
            />
            <QuickAction
              title="Configurar Precios"
              description="Tarifas y descuentos"
              icon={DollarSign}
              color="bg-indigo-600"
              onClick={() => onNavigate("pricing")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Alertas y Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas y Notificaciones</CardTitle>
          <CardDescription>Elementos que requieren atención</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.pendientes > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Reservas pendientes de pago</p>
                  <p className="text-xs text-gray-600">
                    Hay {stats.pendientes} reserva(s) esperando confirmación de pago
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-xs mt-1"
                    onClick={() => onNavigate("reservas")}
                  >
                    Ver reservas →
                  </Button>
                </div>
              </div>
            )}
            
            {stats.pendientes === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No hay alertas pendientes</p>
                <p className="text-xs">Todo está funcionando correctamente</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardHome;
