// src/components/admin/dashboard/DashboardHome.jsx
// Dashboard principal del panel de administración integral
// Muestra métricas en tiempo real de todos los módulos del sistema

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Calendar, 
  DollarSign, 
  Car, 
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  AlertCircle,
  RefreshCw,
  MapPin,
  Receipt,
  CreditCard,
  CheckCircle2,
  XCircle,
  Activity
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { getBackendUrl } from "../../../lib/backend";
import { useAuthenticatedFetch } from "../../../hooks/useAuthenticatedFetch";

/**
 * Componente de Dashboard principal del panel administrativo
 * Muestra métricas clave integradas de todos los módulos
 */
function DashboardHome({ onNavigate }) {
  const { authenticatedFetch } = useAuthenticatedFetch();
  
  const [stats, setStats] = useState({
    reservasHoy: 0,
    ingresosMes: 0,
    ocupacion: 0,
    pendientes: 0,
    reservasTotales: 0,
    vehiculosActivos: 0,
    vehiculosTotal: 0,
    conductoresDisponibles: 0,
    conductoresTotal: 0,
    productosVendidos: 0,
    codigosPagoActivos: 0,
    gastosMes: 0,
    balance: 0,
    tendencias: {
      reservas: { valor: 0, texto: "", tipo: "up" },
      ingresos: { valor: 0, texto: "", tipo: "up" },
    },
    topDestinos: [],
    estadosReservas: {},
    periodo: { mes: "", año: "" },
  });
  const [alertas, setAlertas] = useState([]);
  const [actividad, setActividad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAlertas, setLoadingAlertas] = useState(true);
  const [loadingActividad, setLoadingActividad] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";

  // Cargar estadísticas del dashboard
  const cargarEstadisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${apiUrl}/api/dashboard/stats`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data);
          setLastUpdate(new Date());
        } else {
          throw new Error(data.error || "Error al cargar estadísticas");
        }
      } else {
        throw new Error("No se pudo conectar al servidor");
      }
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
      setError("No se pudieron cargar las estadísticas. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Cargar alertas del dashboard
  const cargarAlertas = useCallback(async () => {
    try {
      setLoadingAlertas(true);
      const response = await authenticatedFetch("/api/dashboard/alertas");
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAlertas(data.alertas || []);
        }
      }
    } catch (err) {
      console.error("Error cargando alertas:", err);
    } finally {
      setLoadingAlertas(false);
    }
  }, [authenticatedFetch]);

  // Cargar actividad reciente
  const cargarActividad = useCallback(async () => {
    try {
      setLoadingActividad(true);
      const response = await authenticatedFetch("/api/dashboard/actividad-reciente");
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setActividad(data.actividad || []);
        }
      }
    } catch (err) {
      console.error("Error cargando actividad:", err);
    } finally {
      setLoadingActividad(false);
    }
  }, [authenticatedFetch]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarEstadisticas();
    cargarAlertas();
    cargarActividad();

    // Actualizar cada 2 minutos
    const interval = setInterval(() => {
      cargarEstadisticas();
      cargarAlertas();
    }, 120000);

    return () => clearInterval(interval);
  }, [cargarEstadisticas, cargarAlertas, cargarActividad]);

  // Refrescar todos los datos
  const handleRefresh = () => {
    cargarEstadisticas();
    cargarAlertas();
    cargarActividad();
  };

  // Formatear moneda CLP
  const formatCurrency = useMemo(() => {
    const formatter = new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    });
    return (value) => formatter.format(value || 0);
  }, []);

  // Formatear fecha relativa
  const formatRelativeTime = (fecha) => {
    const ahora = new Date();
    const diff = ahora - new Date(fecha);
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    
    if (minutos < 1) return "Ahora mismo";
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    return new Date(fecha).toLocaleDateString("es-CL");
  };

  // Componente de tarjeta de KPI
  const KPICard = ({ title, value, icon: Icon, color, bgColor, trend, trendValue, onClick, subtitle }) => {
    return (
      <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4" style={{ borderLeftColor: color.replace("text-", "").includes("blue") ? "#3B82F6" : color.includes("green") ? "#10B981" : color.includes("orange") ? "#F59E0B" : color.includes("red") ? "#EF4444" : "#6B7280" }} onClick={onClick}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${bgColor || "bg-gray-100"}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
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
        className="h-auto p-4 flex items-start gap-3 hover:bg-gray-50 w-full"
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

  // Componente de alerta
  const AlertaItem = ({ alerta }) => {
    const colors = {
      critical: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-600" },
      warning: { bg: "bg-yellow-50", border: "border-yellow-200", icon: "text-yellow-600" },
      info: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600" },
    };
    const style = colors[alerta.tipo] || colors.info;

    return (
      <div className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg} ${style.border}`}>
        <AlertCircle className={`h-5 w-5 mt-0.5 ${style.icon}`} />
        <div className="flex-1">
          <p className="font-medium text-sm">{alerta.titulo}</p>
          <p className="text-xs text-gray-600">{alerta.mensaje}</p>
          {alerta.accion && (
            <Button 
              variant="link" 
              size="sm" 
              className="h-auto p-0 text-xs mt-1"
              onClick={() => onNavigate(alerta.accion)}
            >
              Ver detalles →
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (loading && !stats.reservasHoy) {
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
      {/* Header con periodo y botón de actualizar */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">
            Resumen de {stats.periodo?.mes} {stats.periodo?.año} - Actualizado {lastUpdate ? formatRelativeTime(lastUpdate) : "..."}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Alerta si hay error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <XCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Reintentar
            </Button>
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
          bgColor="bg-blue-100"
          trend={stats.tendencias?.reservas?.tipo}
          trendValue={stats.tendencias?.reservas?.texto}
          onClick={() => onNavigate("reservas")}
        />
        <KPICard
          title="Ingresos del Mes"
          value={formatCurrency(stats.ingresosMes)}
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-100"
          trend={stats.tendencias?.ingresos?.tipo}
          trendValue={stats.tendencias?.ingresos?.texto}
          onClick={() => onNavigate("estadisticas")}
        />
        <KPICard
          title="Ocupación Vehículos"
          value={`${stats.ocupacion}%`}
          icon={Car}
          color="text-orange-600"
          bgColor="bg-orange-100"
          subtitle={`${stats.vehiculosActivos}/${stats.vehiculosTotal} activos`}
          onClick={() => onNavigate("vehiculos")}
        />
        <KPICard
          title="Pendientes de Pago"
          value={stats.pendientes}
          icon={Clock}
          color={stats.pendientes > 0 ? "text-red-600" : "text-gray-600"}
          bgColor={stats.pendientes > 0 ? "bg-red-100" : "bg-gray-100"}
          onClick={() => onNavigate("reservas")}
        />
      </div>

      {/* Panel de Balance Financiero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Balance Financiero del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Ingresos</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.ingresosMes)}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Gastos</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(stats.gastosMes)}</p>
              </div>
              <div className={`text-center p-4 rounded-lg ${stats.balance >= 0 ? "bg-blue-50" : "bg-yellow-50"}`}>
                <p className="text-sm text-gray-600">Balance</p>
                <p className={`text-xl font-bold ${stats.balance >= 0 ? "text-blue-600" : "text-yellow-600"}`}>
                  {formatCurrency(stats.balance)}
                </p>
              </div>
            </div>
            {/* Barra de progreso de ocupación */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Utilización de flota</span>
                <span className="font-medium">{stats.ocupacion}%</span>
              </div>
              <Progress value={stats.ocupacion} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Top Destinos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Top Destinos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topDestinos?.length > 0 ? (
              <div className="space-y-2">
                {stats.topDestinos.map((destino, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs w-6 justify-center">{index + 1}</Badge>
                      <span className="truncate max-w-[120px]">{destino.destino}</span>
                    </div>
                    <span className="font-medium text-gray-600">{destino.total} viajes</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Sin datos este mes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Métricas Secundarias */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("reservas")}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.reservasTotales}</div>
            <p className="text-xs text-gray-500">Reservas del mes</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("vehiculos")}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.vehiculosActivos}</div>
            <p className="text-xs text-gray-500">Vehículos activos</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("conductores")}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.conductoresDisponibles}</div>
            <p className="text-xs text-gray-500">Conductores</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("productos")}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.productosVendidos || 0}</div>
            <p className="text-xs text-gray-500">Productos vendidos</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("codigos-pago")}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.codigosPagoActivos || 0}</div>
            <p className="text-xs text-gray-500">Códigos de pago</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("gastos")}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{formatCurrency(stats.gastosMes).replace("CLP", "").trim()}</div>
            <p className="text-xs text-gray-500">Gastos del mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Panel dividido: Alertas y Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas y Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Alertas y Notificaciones
              {alertas.length > 0 && (
                <Badge variant="destructive" className="ml-2">{alertas.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Elementos que requieren atención</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {loadingAlertas ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : alertas.length > 0 ? (
                alertas.map((alerta, index) => (
                  <AlertaItem key={index} alerta={alerta} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">No hay alertas pendientes</p>
                  <p className="text-xs">Todo está funcionando correctamente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Últimas 24 horas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {loadingActividad ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : actividad.length > 0 ? (
                actividad.slice(0, 8).map((item, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                    <div className={`p-1.5 rounded-full ${item.tipo === "reserva" ? "bg-blue-100" : "bg-red-100"}`}>
                      {item.tipo === "reserva" ? (
                        <Calendar className="h-3 w-3 text-blue-600" />
                      ) : (
                        <Receipt className="h-3 w-3 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.titulo}</p>
                      <p className="text-xs text-gray-500 truncate">{item.descripcion}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${item.monto >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(Math.abs(item.monto))}
                      </p>
                      <p className="text-xs text-gray-400">{formatRelativeTime(item.fecha)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Sin actividad reciente</p>
                </div>
              )}
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <QuickAction
              title="Nueva Reserva"
              description="Crear reserva"
              icon={Calendar}
              color="bg-blue-600"
              onClick={() => onNavigate("reservas")}
            />
            <QuickAction
              title="Estadísticas"
              description="Ver reportes"
              icon={TrendingUp}
              color="bg-green-600"
              onClick={() => onNavigate("estadisticas")}
            />
            <QuickAction
              title="Vehículos"
              description="Gestionar flota"
              icon={Car}
              color="bg-orange-600"
              onClick={() => onNavigate("vehiculos")}
            />
            <QuickAction
              title="Conductores"
              description="Personal"
              icon={Users}
              color="bg-purple-600"
              onClick={() => onNavigate("conductores")}
            />
            <QuickAction
              title="Códigos de Pago"
              description="Generar código"
              icon={CreditCard}
              color="bg-teal-600"
              onClick={() => onNavigate("codigos-pago")}
            />
            <QuickAction
              title="Gastos"
              description="Registrar gasto"
              icon={Receipt}
              color="bg-red-600"
              onClick={() => onNavigate("gastos")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardHome;
