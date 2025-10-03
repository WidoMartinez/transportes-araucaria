import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { CalendarDays, Users, DollarSign, TrendingUp, MapPin, Clock, Search, Filter, Download, Plus, Settings, BarChart3 } from 'lucide-react'
import FormularioReserva from './FormularioReserva.jsx'
import AdminCodigosMejorado from './AdminCodigosMejorado.jsx'
import HistorialCodigos from './HistorialCodigos.jsx'

// Datos de ejemplo para el dashboard
const mockData = {
  kpis: {
    totalReservas: 1247,
    ingresosTotales: 2850000,
    tasaOcupacion: 78,
    reservasPendientes: 23,
    reservasCanceladas: 45,
    valorPromedioReserva: 2287
  },
  reservasPorDestino: [
    { destino: 'Pucón', reservas: 320, ingresos: 730000 },
    { destino: 'Villarrica', reservas: 280, ingresos: 640000 },
    { destino: 'Temuco', reservas: 250, ingresos: 570000 },
    { destino: 'Lonquimay', reservas: 180, ingresos: 410000 },
    { destino: 'Corralco', reservas: 150, ingresos: 340000 },
    { destino: 'Conguillío', reservas: 67, ingresos: 160000 }
  ],
  reservasPorMes: [
    { mes: 'Ene', reservas: 95, ingresos: 215000 },
    { mes: 'Feb', reservas: 120, ingresos: 275000 },
    { mes: 'Mar', reservas: 140, ingresos: 320000 },
    { mes: 'Abr', reservas: 110, ingresos: 250000 },
    { mes: 'May', reservas: 85, ingresos: 195000 },
    { mes: 'Jun', reservas: 75, ingresos: 170000 },
    { mes: 'Jul', reservas: 160, ingresos: 365000 },
    { mes: 'Ago', reservas: 180, ingresos: 410000 },
    { mes: 'Sep', reservas: 145, ingresos: 330000 },
    { mes: 'Oct', reservas: 132, ingresos: 300000 }
  ],
  reservasRecientes: [
    { id: 'R001', cliente: 'María González', destino: 'Pucón', fecha: '2025-10-05', estado: 'Confirmada', monto: 2500, codigo: 'DESC10' },
    { id: 'R002', cliente: 'Carlos Rodríguez', destino: 'Villarrica', fecha: '2025-10-06', estado: 'Pendiente', monto: 1800, codigo: null },
    { id: 'R003', cliente: 'Ana Martínez', destino: 'Temuco', fecha: '2025-10-07', estado: 'Confirmada', monto: 2200, codigo: 'VERANO25' },
    { id: 'R004', cliente: 'Luis Fernández', destino: 'Lonquimay', fecha: '2025-10-08', estado: 'Cancelada', monto: 1950, codigo: null },
    { id: 'R005', cliente: 'Patricia Silva', destino: 'Corralco', fecha: '2025-10-09', estado: 'Confirmada', monto: 2800, codigo: 'DESC15' }
  ]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function DashboardReservas() {
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [reservasFiltradas, setReservasFiltradas] = useState(mockData.reservasRecientes)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [vistaActual, setVistaActual] = useState('dashboard')

  useEffect(() => {
    let reservas = mockData.reservasRecientes
    
    if (filtroEstado !== 'todos') {
      reservas = reservas.filter(reserva => 
        reserva.estado.toLowerCase() === filtroEstado.toLowerCase()
      )
    }
    
    if (busqueda) {
      reservas = reservas.filter(reserva =>
        reserva.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        reserva.id.toLowerCase().includes(busqueda.toLowerCase()) ||
        reserva.destino.toLowerCase().includes(busqueda.toLowerCase())
      )
    }
    
    setReservasFiltradas(reservas)
  }, [filtroEstado, busqueda])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount)
  }

  const getEstadoBadge = (estado) => {
    const variants = {
      'Confirmada': 'default',
      'Pendiente': 'secondary',
      'Cancelada': 'destructive'
    }
    return <Badge variant={variants[estado] || 'outline'}>{estado}</Badge>
  }

  const handleNuevaReserva = (datosReserva) => {
    console.log('Nueva reserva:', datosReserva)
    // Aquí se enviarían los datos al backend
    setMostrarFormulario(false)
    // Actualizar la lista de reservas
  }

  const cerrarFormulario = () => {
    setMostrarFormulario(false)
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Reservas</h1>
          <p className="text-gray-600">Transportes Araucaria - Gestión Integral</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setVistaActual('codigos')} className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Códigos
          </Button>
          <Button variant="outline" onClick={() => setVistaActual('historial')} className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Historial
          </Button>
          <Button className="flex items-center gap-2" onClick={() => setMostrarFormulario(true)}>
            <Plus className="h-4 w-4" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.kpis.totalReservas.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockData.kpis.ingresosTotales)}</div>
            <p className="text-xs text-muted-foreground">+8% desde el mes pasado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.kpis.tasaOcupacion}%</div>
            <p className="text-xs text-muted-foreground">+5% desde el mes pasado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.kpis.reservasPendientes}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Canceladas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.kpis.reservasCanceladas}</div>
            <p className="text-xs text-muted-foreground">-3% desde el mes pasado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Promedio</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockData.kpis.valorPromedioReserva)}</div>
            <p className="text-xs text-muted-foreground">Por reserva</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reservas por Destino</CardTitle>
            <CardDescription>Distribución de reservas por destino turístico</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockData.reservasPorDestino}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="destino" />
                <YAxis />
                <Tooltip formatter={(value, name) => [value, name === 'reservas' ? 'Reservas' : 'Ingresos']} />
                <Bar dataKey="reservas" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Reservas</CardTitle>
            <CardDescription>Evolución mensual de reservas e ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockData.reservasPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="reservas" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Reservas Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Reservas Recientes</CardTitle>
              <CardDescription>Gestión y seguimiento de reservas</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar reservas..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservasFiltradas.map((reserva) => (
                <TableRow key={reserva.id}>
                  <TableCell className="font-medium">{reserva.id}</TableCell>
                  <TableCell>{reserva.cliente}</TableCell>
                  <TableCell>{reserva.destino}</TableCell>
                  <TableCell>{reserva.fecha}</TableCell>
                  <TableCell>{getEstadoBadge(reserva.estado)}</TableCell>
                  <TableCell>{formatCurrency(reserva.monto)}</TableCell>
                  <TableCell>
                    {reserva.codigo ? (
                      <Badge variant="outline">{reserva.codigo}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Ver</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Tabs value={vistaActual} onValueChange={setVistaActual}>
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="codigos">Códigos</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {vistaActual === 'dashboard' && renderDashboard()}
        {vistaActual === 'codigos' && <AdminCodigosMejorado />}
        {vistaActual === 'historial' && <HistorialCodigos />}

        {/* Formulario de Nueva Reserva */}
        {mostrarFormulario && (
          <FormularioReserva
            onClose={cerrarFormulario}
            onSubmit={handleNuevaReserva}
          />
        )}
      </div>
    </div>
  )
}
