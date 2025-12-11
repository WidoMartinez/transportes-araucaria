// src/components/admin-v3/AdminPanelV3.jsx
// Panel de Administración V3 - Diseño completamente nuevo
// Arquitectura: Command Center + Widget-based Dashboard

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Command,
  Search,
  Bell,
  Moon,
  Sun,
  LogOut,
  User,
  Shield,
  Menu,
  X,
  Home,
  Calendar,
  Car,
  Users,
  DollarSign,
  Package,
  Settings,
  BarChart3,
  Receipt,
  Tag,
  Percent,
  CalendarDays,
  TrendingUp,
  Zap,
  Plus,
  ChevronRight,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  Eye,
  Star,
  Bookmark,
  Grid3X3,
  List,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { getBackendUrl } from "../../lib/backend";

// Importar componentes existentes del admin
import AdminReservas from "../AdminReservas";
import AdminVehiculos from "../AdminVehiculos";
import AdminConductores from "../AdminConductores";
import AdminGastos from "../AdminGastos";
import AdminEstadisticas from "../AdminEstadisticas";
import AdminProductos from "../AdminProductos";
import AdminCodigosPago from "../AdminCodigosPago";
import AdminPricing from "../AdminPricing";
import AdminTarifaDinamica from "../AdminTarifaDinamica";
import AdminDisponibilidad from "../AdminDisponibilidad";
import AdminFestivos from "../AdminFestivos";
import AdminCodigos from "../AdminCodigos";
import AdminCodigosMejorado from "../AdminCodigosMejorado";
import AdminUsuarios from "../AdminUsuarios";
import AdminPerfil from "../AdminPerfil";

/**
 * Panel de Administración V3
 * Diseño moderno tipo "Command Center" con widgets personalizables
 */
function AdminPanelV3() {
  const { user, logout } = useAuth();
  
  // Estados principales
  const [activeModule, setActiveModule] = useState("command-center");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [quickStats, setQuickStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [favoriteModules, setFavoriteModules] = useState(["reservas", "vehiculos", "gastos"]);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  // Definición de módulos del sistema
  const modules = {
    operaciones: {
      label: "Centro de Operaciones",
      icon: Zap,
      color: "emerald",
      items: [
        { id: "reservas", label: "Reservas", icon: Calendar, description: "Gestión de reservas y viajes" },
        { id: "vehiculos", label: "Flota", icon: Car, description: "Control de vehículos" },
        { id: "conductores", label: "Conductores", icon: Users, description: "Gestión de personal" },
      ]
    },
    finanzas: {
      label: "Centro Financiero",
      icon: DollarSign,
      color: "blue",
      items: [
        { id: "gastos", label: "Gastos", icon: Receipt, description: "Registro de gastos" },
        { id: "estadisticas", label: "Analíticas", icon: BarChart3, description: "Reportes y métricas" },
        { id: "codigos-pago", label: "Códigos de Pago", icon: Tag, description: "Gestión de pagos" },
      ]
    },
    configuracion: {
      label: "Configuración",
      icon: Settings,
      color: "violet",
      items: [
        { id: "pricing", label: "Tarifas", icon: DollarSign, description: "Precios base" },
        { id: "tarifa-dinamica", label: "Precios Dinámicos", icon: TrendingUp, description: "Ajustes automáticos" },
        { id: "productos", label: "Catálogo", icon: Package, description: "Productos y extras" },
        { id: "disponibilidad", label: "Disponibilidad", icon: Clock, description: "Horarios y capacidad" },
        { id: "festivos", label: "Calendario", icon: CalendarDays, description: "Festivos y eventos" },
      ]
    },
    marketing: {
      label: "Marketing",
      icon: Percent,
      color: "pink",
      items: [
        { id: "codigos", label: "Promociones", icon: Tag, description: "Códigos de descuento" },
        { id: "codigos-mejorado", label: "Campañas", icon: Sparkles, description: "Gestión avanzada" },
      ]
    },
    sistema: {
      label: "Sistema",
      icon: Shield,
      color: "slate",
      items: [
        ...(user?.rol === "superadmin" ? [{ id: "usuarios", label: "Usuarios", icon: Users, description: "Administración" }] : []),
        { id: "perfil", label: "Mi Perfil", icon: User, description: "Configuración personal" },
      ]
    }
  };

  // Cargar estadísticas rápidas
  useEffect(() => {
    const cargarStats = async () => {
      try {
        const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
        const response = await fetch(`${apiUrl}/api/dashboard/stats`);
        if (response.ok) {
          const data = await response.json();
          setQuickStats(data);
        }
      } catch (err) {
        console.error("Error cargando stats:", err);
      }
    };
    cargarStats();
    const interval = setInterval(cargarStats, 60000);
    return () => clearInterval(interval);
  }, []);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K para command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Escape para cerrar
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  // Navegar a módulo
  const navigateTo = (moduleId) => {
    setActiveModule(moduleId);
    setCommandPaletteOpen(false);
    setSearchOpen(false);
  };

  // Toggle favorito
  const toggleFavorite = (moduleId) => {
    setFavoriteModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Cerrar sesión
  const handleLogout = () => {
    if (confirm("¿Desea cerrar sesión?")) logout();
  };

  // Obtener color del módulo
  const getModuleColor = (color) => {
    const colors = {
      emerald: "from-emerald-500 to-emerald-600",
      blue: "from-blue-500 to-blue-600",
      violet: "from-violet-500 to-violet-600",
      pink: "from-pink-500 to-pink-600",
      slate: "from-slate-500 to-slate-600",
      amber: "from-amber-500 to-amber-600",
    };
    return colors[color] || colors.blue;
  };

  // Componente: Barra de búsqueda global (Command Palette)
  const CommandPalette = () => {
    const allModules = Object.values(modules).flatMap(cat => cat.items);
    const filteredModules = allModules.filter(m => 
      m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!commandPaletteOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCommandPaletteOpen(false)} />
        <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3 p-4 border-b">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar módulos, acciones, comandos..."
              className="flex-1 bg-transparent outline-none text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-gray-100 px-2 font-mono text-xs text-gray-600">
              ESC
            </kbd>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {/* Acciones rápidas */}
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Acciones Rápidas
            </div>
            <button
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-left"
              onClick={() => { navigateTo("reservas"); }}
            >
              <div className="p-2 rounded-lg bg-emerald-100">
                <Plus className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium">Nueva Reserva</p>
                <p className="text-sm text-gray-500">Crear una nueva reserva de viaje</p>
              </div>
            </button>
            
            {/* Módulos */}
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
              Módulos
            </div>
            {filteredModules.map(module => (
              <button
                key={module.id}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-left"
                onClick={() => navigateTo(module.id)}
              >
                <div className="p-2 rounded-lg bg-gray-100">
                  <module.icon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{module.label}</p>
                  <p className="text-sm text-gray-500">{module.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            ))}
          </div>
          <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 rounded bg-gray-200">↑↓</kbd> Navegar</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-gray-200">Enter</kbd> Seleccionar</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-gray-200">ESC</kbd> Cerrar</span>
          </div>
        </div>
      </div>
    );
  };

  // Componente: Command Center (Dashboard principal)
  const CommandCenter = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                ¡Bienvenido, {user?.nombre?.split(" ")[0] || "Admin"}! 👋
              </h1>
              <p className="text-slate-300">
                {new Date().toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <Button 
              variant="outline" 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => setCommandPaletteOpen(true)}
            >
              <Command className="h-4 w-4 mr-2" />
              Buscar
              <kbd className="ml-2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-xs">
                ⌘K
              </kbd>
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-emerald-300 text-sm mb-1">
                <Activity className="h-4 w-4" />
                Reservas Hoy
              </div>
              <p className="text-3xl font-bold">{quickStats?.reservasHoy || 0}</p>
              <p className="text-slate-400 text-sm mt-1">+2 vs ayer</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-blue-300 text-sm mb-1">
                <DollarSign className="h-4 w-4" />
                Ingresos Mes
              </div>
              <p className="text-3xl font-bold">{formatCurrency(quickStats?.ingresosMes || 0).replace("CLP", "$")}</p>
              <p className="text-slate-400 text-sm mt-1">+15% vs anterior</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-amber-300 text-sm mb-1">
                <Car className="h-4 w-4" />
                Flota Activa
              </div>
              <p className="text-3xl font-bold">{quickStats?.vehiculosActivos || 0}</p>
              <p className="text-slate-400 text-sm mt-1">vehículos disponibles</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-rose-300 text-sm mb-1">
                <Clock className="h-4 w-4" />
                Pendientes
              </div>
              <p className="text-3xl font-bold">{quickStats?.pendientes || 0}</p>
              <p className="text-slate-400 text-sm mt-1">requieren atención</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accesos Rápidos */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Acceso Rápido</h2>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Personalizar
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(modules).slice(0, 2).map(([key, category]) => 
              category.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className="group relative overflow-hidden rounded-xl bg-white border p-4 text-left hover:shadow-lg transition-all hover:border-gray-300"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${getModuleColor(category.color)} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  <div className="relative">
                    <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${getModuleColor(category.color)} mb-3`}>
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">{item.label}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {favoriteModules.includes(item.id) ? (
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }} />
                    ) : (
                      <Star className="h-4 w-4 text-gray-300 hover:text-amber-400" onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }} />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          {/* Alertas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(quickStats?.pendientes || 0) > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <Clock className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">{quickStats?.pendientes} reservas pendientes</p>
                      <p className="text-xs text-amber-600">Requieren confirmación de pago</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigateTo("reservas")}>
                    Ver todas <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm">Todo en orden</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones frecuentes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Acciones Frecuentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigateTo("reservas")}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Reserva
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigateTo("gastos")}>
                <Receipt className="h-4 w-4 mr-2" />
                Registrar Gasto
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigateTo("estadisticas")}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Reportes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Todos los módulos */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Todos los Módulos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Object.entries(modules).map(([key, category]) => (
            <Card key={key} className="overflow-hidden">
              <CardHeader className={`bg-gradient-to-br ${getModuleColor(category.color)} text-white py-3`}>
                <CardTitle className="text-sm flex items-center gap-2">
                  <category.icon className="h-4 w-4" />
                  {category.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {category.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 text-left text-sm"
                  >
                    <item.icon className="h-4 w-4 text-gray-500" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  // Renderizar módulo activo
  const renderActiveModule = () => {
    switch (activeModule) {
      case "command-center": return <CommandCenter />;
      case "reservas": return <AdminReservas />;
      case "vehiculos": return <AdminVehiculos />;
      case "conductores": return <AdminConductores />;
      case "gastos": return <AdminGastos />;
      case "estadisticas": return <AdminEstadisticas />;
      case "codigos-pago": return <AdminCodigosPago />;
      case "pricing": return <AdminPricing />;
      case "tarifa-dinamica": return <AdminTarifaDinamica />;
      case "productos": return <AdminProductos />;
      case "disponibilidad": return <AdminDisponibilidad />;
      case "festivos": return <AdminFestivos />;
      case "codigos": return <AdminCodigos />;
      case "codigos-mejorado": return <AdminCodigosMejorado />;
      case "usuarios": return <AdminUsuarios />;
      case "perfil": return <AdminPerfil />;
      default: return <CommandCenter />;
    }
  };

  return (
    <div className={cn("min-h-screen flex", darkMode && "dark bg-slate-900")}>
      {/* Sidebar Minimalista */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-white border-r z-40 flex flex-col transition-all duration-300",
        sidebarExpanded ? "w-64" : "w-16"
      )}>
        {/* Logo */}
        <div className="p-4 border-b flex items-center justify-between">
          {sidebarExpanded ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                A
              </div>
              <span className="font-semibold">Araucaria</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold mx-auto">
              A
            </div>
          )}
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className={cn("p-1 hover:bg-gray-100 rounded", !sidebarExpanded && "hidden")}
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {/* Command Center */}
          <button
            onClick={() => setActiveModule("command-center")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-2 transition-all",
              activeModule === "command-center" 
                ? "bg-emerald-50 text-emerald-700 font-medium" 
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Home className="h-5 w-5 flex-shrink-0" />
            {sidebarExpanded && <span>Centro de Control</span>}
          </button>

          {/* Módulos por categoría */}
          {Object.entries(modules).map(([key, category]) => (
            <div key={key} className="mb-2">
              {sidebarExpanded && (
                <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {category.label}
                </p>
              )}
              {category.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                    activeModule === item.id 
                      ? "bg-gray-100 text-gray-900 font-medium" 
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                  title={!sidebarExpanded ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {sidebarExpanded && <span className="text-sm">{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer del sidebar */}
        <div className="p-2 border-t">
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            {sidebarExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        sidebarExpanded ? "ml-64" : "ml-16"
      )}>
        {/* Header Superior */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b">
          <div className="px-6 py-3 flex items-center justify-between">
            {/* Breadcrumb / Título */}
            <div className="flex items-center gap-3">
              {activeModule !== "command-center" && (
                <button
                  onClick={() => setActiveModule("command-center")}
                  className="p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <Home className="h-4 w-4" />
                </button>
              )}
              <h1 className="font-semibold text-lg">
                {activeModule === "command-center" ? "Centro de Control" : 
                 Object.values(modules).flatMap(m => m.items).find(i => i.id === activeModule)?.label || "Panel"}
              </h1>
            </div>

            {/* Acciones del header */}
            <div className="flex items-center gap-3">
              {/* Búsqueda rápida */}
              <Button variant="outline" size="sm" onClick={() => setCommandPaletteOpen(true)}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
                <kbd className="ml-2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-xs">
                  ⌘K
                </kbd>
              </Button>

              {/* Notificaciones */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </Button>

              {/* Perfil */}
              <div className="flex items-center gap-3 pl-3 border-l">
                {user && (
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{user.nombre}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.rol}</p>
                  </div>
                )}
                <Button variant="ghost" size="icon" onClick={() => navigateTo("perfil")}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {user?.nombre?.charAt(0) || "A"}
                  </div>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Área de contenido */}
        <div className="p-6">
          {renderActiveModule()}
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
}

export default AdminPanelV3;
