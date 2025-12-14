// src/components/admin/layout/AdminSidebar.jsx

import { useState } from "react";
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  Package, 
  DollarSign, 
  BarChart3,
  Settings,
  Tag,
  Shield,
  User,
  ChevronDown,
  ChevronRight,
  Truck,
  Receipt,
  TrendingUp,
  Calendar,
  CalendarDays,
  Ban,
  Percent,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from "lucide-react";
import { Button } from "../../ui/button";
import { cn } from "../../../lib/utils";

/**
 * Componente de barra lateral para el panel administrativo
 * Organiza los módulos en categorías colapsables
 */
function AdminSidebar({ activePanel, onPanelChange, userRole, isCollapsed, onToggleCollapse }) {
  // Estados para categorías expandidas/colapsadas
  const [expandedCategories, setExpandedCategories] = useState({
    dashboard: true,
    operaciones: true,
    finanzas: true,
    configuracion: false,
    marketing: false,
    sistema: false,
  });

  // Toggle de una categoría
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Definición de categorías y sus módulos
  const menuCategories = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      items: [
        { id: "dashboard", label: "Inicio", icon: LayoutDashboard }
      ]
    },
    {
      id: "operaciones",
      label: "Operaciones",
      icon: Truck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      items: [
        { id: "reservas", label: "Reservas", icon: Calendar },
        { id: "vehiculos", label: "Vehículos", icon: Car },
        { id: "conductores", label: "Conductores", icon: Users }
      ]
    },
    {
      id: "finanzas",
      label: "Finanzas",
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      items: [
        { id: "gastos", label: "Gastos", icon: Receipt },
        { id: "estadisticas", label: "Estadísticas", icon: BarChart3 },
        { id: "codigos-pago", label: "Códigos de Pago", icon: Tag }
      ]
    },
    {
      id: "configuracion",
      label: "Configuración",
      icon: Settings,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      items: [
        { id: "pricing", label: "Precios", icon: DollarSign },
        { id: "tarifa-dinamica", label: "Tarifa Dinámica", icon: TrendingUp },
        { id: "productos", label: "Productos", icon: Package },
        { id: "disponibilidad", label: "Disponibilidad", icon: Calendar },
        { id: "festivos", label: "Festivos", icon: CalendarDays },
        { id: "bloqueos", label: "Bloqueos de Agenda", icon: Ban }
      ]
    },
    {
      id: "marketing",
      label: "Marketing",
      icon: Percent,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      items: [
        { id: "codigos", label: "Códigos", icon: Tag },
        { id: "codigos-mejorado", label: "Códigos Mejorado", icon: Tag }
      ]
    },
    {
      id: "sistema",
      label: "Sistema",
      icon: Shield,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      items: [
        ...(userRole === "superadmin" ? [
          { id: "usuarios", label: "Usuarios", icon: Users }
        ] : []),
        { id: "perfil", label: "Mi Perfil", icon: User }
      ]
    }
  ];

  // Renderizar un item del menú
  const renderMenuItem = (item, categoryColor) => {
    const Icon = item.icon;
    const isActive = activePanel === item.id;

    return (
      <button
        key={item.id}
        onClick={() => onPanelChange(item.id)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
          "hover:bg-gray-100",
          isActive ? "bg-primary text-primary-foreground font-medium shadow-sm" : "text-gray-700",
          isCollapsed && "justify-center px-2"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className={cn("h-4 w-4 flex-shrink-0", !isActive && categoryColor)} />
        {!isCollapsed && <span>{item.label}</span>}
      </button>
    );
  };

  // Renderizar una categoría
  const renderCategory = (category) => {
    const CategoryIcon = category.icon;
    const isExpanded = expandedCategories[category.id];
    const hasActiveItem = category.items.some(item => item.id === activePanel);

    // Para dashboard, no mostrar como categoría expandible si está colapsado
    if (category.id === "dashboard") {
      return (
        <div key={category.id} className="mb-1">
          {renderMenuItem(category.items[0], category.color)}
        </div>
      );
    }

    return (
      <div key={category.id} className="mb-1">
        {/* Header de la categoría */}
        <button
          onClick={() => !isCollapsed && toggleCategory(category.id)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
            "hover:bg-gray-50",
            hasActiveItem ? category.bgColor : "text-gray-600",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? category.label : undefined}
        >
          <CategoryIcon className={cn("h-5 w-5 flex-shrink-0", category.color)} />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">{category.label}</span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
        </button>

        {/* Items de la categoría */}
        {!isCollapsed && isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
            {category.items.map(item => renderMenuItem(item, category.color))}
          </div>
        )}

        {/* Mostrar items cuando está colapsado al hacer hover */}
        {isCollapsed && (
          <div className="hidden group-hover:block absolute left-full top-0 ml-2 w-48 bg-white shadow-lg rounded-lg border p-2 z-50">
            <div className="font-medium text-sm mb-2 px-2 text-gray-600">{category.label}</div>
            {category.items.map(item => renderMenuItem(item, category.color))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "bg-white border-r shadow-sm transition-all duration-300 flex flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header del sidebar con toggle */}
      <div className="p-4 border-b flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="font-semibold text-lg">Menú</h2>
            <p className="text-xs text-gray-500">Navegación</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuCategories.map(category => (
          <div key={category.id} className="relative group">
            {renderCategory(category)}
          </div>
        ))}
      </nav>

      {/* Footer con información */}
      {!isCollapsed && (
        <div className="p-3 border-t text-xs text-gray-500">
          <p className="font-medium mb-1">Transportes Araucaria</p>
          <p>Panel de Administración v2.0</p>
        </div>
      )}
    </aside>
  );
}

export default AdminSidebar;
