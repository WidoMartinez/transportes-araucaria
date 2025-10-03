import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Calendar } from '@/components/ui/calendar.jsx'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.jsx'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, ChevronLeft, ChevronRight, Check, User, MapPin, CreditCard, FileText } from 'lucide-react'

const PASOS = [
  { id: 1, titulo: 'Información del Cliente', icono: User },
  { id: 2, titulo: 'Detalles del Viaje', icono: MapPin },
  { id: 3, titulo: 'Pago y Códigos', icono: CreditCard },
  { id: 4, titulo: 'Confirmación', icono: FileText }
]

const DESTINOS = [
  { id: 'pucon', nombre: 'Pucón', precio: 2500 },
  { id: 'villarrica', nombre: 'Villarrica', precio: 2200 },
  { id: 'temuco', nombre: 'Temuco', precio: 1800 },
  { id: 'lonquimay', nombre: 'Lonquimay', precio: 2800 },
  { id: 'corralco', nombre: 'Corralco', precio: 3200 },
  { id: 'conguillio', nombre: 'Conguillío', precio: 2900 }
]

export default function FormularioReserva({ onClose, onSubmit }) {
  const [pasoActual, setPasoActual] = useState(1)
  const [fecha, setFecha] = useState()
  const [formData, setFormData] = useState({
    // Paso 1: Cliente
    nombre: '',
    email: '',
    telefono: '',
    rut: '',
    
    // Paso 2: Viaje
    destino: '',
    fechaViaje: null,
    pasajeros: 1,
    tipoServicio: '',
    observaciones: '',
    
    // Paso 3: Pago
    metodoPago: '',
    codigoDescuento: '',
    descuentoAplicado: 0,
    
    // Calculados
    subtotal: 0,
    total: 0
  })

  const [errores, setErrores] = useState({})
  const [codigoValidado, setCodigoValidado] = useState(false)

  const actualizarFormData = (campo, valor) => {
    setFormData(prev => {
      const nuevo = { ...prev, [campo]: valor }
      
      // Calcular precios automáticamente
      if (campo === 'destino' || campo === 'pasajeros') {
        const destino = DESTINOS.find(d => d.id === (campo === 'destino' ? valor : nuevo.destino))
        if (destino) {
          nuevo.subtotal = destino.precio * nuevo.pasajeros
          nuevo.total = nuevo.subtotal - (nuevo.subtotal * nuevo.descuentoAplicado / 100)
        }
      }
      
      return nuevo
    })
  }

  const validarPaso = (paso) => {
    const nuevosErrores = {}
    
    switch (paso) {
      case 1:
        if (!formData.nombre) nuevosErrores.nombre = 'Nombre es requerido'
        if (!formData.email) nuevosErrores.email = 'Email es requerido'
        if (!formData.telefono) nuevosErrores.telefono = 'Teléfono es requerido'
        if (!formData.rut) nuevosErrores.rut = 'RUT es requerido'
        break
      case 2:
        if (!formData.destino) nuevosErrores.destino = 'Destino es requerido'
        if (!formData.fechaViaje) nuevosErrores.fechaViaje = 'Fecha de viaje es requerida'
        if (!formData.tipoServicio) nuevosErrores.tipoServicio = 'Tipo de servicio es requerido'
        break
      case 3:
        if (!formData.metodoPago) nuevosErrores.metodoPago = 'Método de pago es requerido'
        break
    }
    
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const siguientePaso = () => {
    if (validarPaso(pasoActual)) {
      setPasoActual(prev => Math.min(prev + 1, 4))
    }
  }

  const pasoAnterior = () => {
    setPasoActual(prev => Math.max(prev - 1, 1))
  }

  const validarCodigo = async () => {
    // Simulación de validación de código
    if (formData.codigoDescuento === 'DESC10') {
      actualizarFormData('descuentoAplicado', 10)
      setCodigoValidado(true)
    } else if (formData.codigoDescuento === 'DESC15') {
      actualizarFormData('descuentoAplicado', 15)
      setCodigoValidado(true)
    } else if (formData.codigoDescuento === 'VERANO25') {
      actualizarFormData('descuentoAplicado', 25)
      setCodigoValidado(true)
    } else {
      setCodigoValidado(false)
      actualizarFormData('descuentoAplicado', 0)
    }
  }

  const enviarFormulario = () => {
    if (validarPaso(3)) {
      onSubmit(formData)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount)
  }

  const renderPaso1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nombre">Nombre Completo *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => actualizarFormData('nombre', e.target.value)}
            className={errores.nombre ? 'border-red-500' : ''}
          />
          {errores.nombre && <p className="text-red-500 text-sm mt-1">{errores.nombre}</p>}
        </div>
        <div>
          <Label htmlFor="rut">RUT *</Label>
          <Input
            id="rut"
            value={formData.rut}
            onChange={(e) => actualizarFormData('rut', e.target.value)}
            placeholder="12.345.678-9"
            className={errores.rut ? 'border-red-500' : ''}
          />
          {errores.rut && <p className="text-red-500 text-sm mt-1">{errores.rut}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => actualizarFormData('email', e.target.value)}
            className={errores.email ? 'border-red-500' : ''}
          />
          {errores.email && <p className="text-red-500 text-sm mt-1">{errores.email}</p>}
        </div>
        <div>
          <Label htmlFor="telefono">Teléfono *</Label>
          <Input
            id="telefono"
            value={formData.telefono}
            onChange={(e) => actualizarFormData('telefono', e.target.value)}
            placeholder="+56 9 1234 5678"
            className={errores.telefono ? 'border-red-500' : ''}
          />
          {errores.telefono && <p className="text-red-500 text-sm mt-1">{errores.telefono}</p>}
        </div>
      </div>
    </div>
  )

  const renderPaso2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="destino">Destino *</Label>
          <Select value={formData.destino} onValueChange={(value) => actualizarFormData('destino', value)}>
            <SelectTrigger className={errores.destino ? 'border-red-500' : ''}>
              <SelectValue placeholder="Seleccionar destino" />
            </SelectTrigger>
            <SelectContent>
              {DESTINOS.map(destino => (
                <SelectItem key={destino.id} value={destino.id}>
                  {destino.nombre} - {formatCurrency(destino.precio)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errores.destino && <p className="text-red-500 text-sm mt-1">{errores.destino}</p>}
        </div>
        <div>
          <Label htmlFor="pasajeros">Número de Pasajeros</Label>
          <Select value={formData.pasajeros.toString()} onValueChange={(value) => actualizarFormData('pasajeros', parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6,7,8].map(num => (
                <SelectItem key={num} value={num.toString()}>{num} pasajero{num > 1 ? 's' : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Fecha de Viaje *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${errores.fechaViaje ? 'border-red-500' : ''}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.fechaViaje ? format(formData.fechaViaje, "PPP", { locale: es }) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.fechaViaje}
                onSelect={(date) => actualizarFormData('fechaViaje', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errores.fechaViaje && <p className="text-red-500 text-sm mt-1">{errores.fechaViaje}</p>}
        </div>
        <div>
          <Label htmlFor="tipoServicio">Tipo de Servicio *</Label>
          <Select value={formData.tipoServicio} onValueChange={(value) => actualizarFormData('tipoServicio', value)}>
            <SelectTrigger className={errores.tipoServicio ? 'border-red-500' : ''}>
              <SelectValue placeholder="Seleccionar servicio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ida">Solo Ida</SelectItem>
              <SelectItem value="ida-vuelta">Ida y Vuelta</SelectItem>
              <SelectItem value="tour">Tour Completo</SelectItem>
            </SelectContent>
          </Select>
          {errores.tipoServicio && <p className="text-red-500 text-sm mt-1">{errores.tipoServicio}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea
          id="observaciones"
          value={formData.observaciones}
          onChange={(e) => actualizarFormData('observaciones', e.target.value)}
          placeholder="Información adicional sobre el viaje..."
          rows={3}
        />
      </div>
    </div>
  )

  const renderPaso3 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="metodoPago">Método de Pago *</Label>
          <Select value={formData.metodoPago} onValueChange={(value) => actualizarFormData('metodoPago', value)}>
            <SelectTrigger className={errores.metodoPago ? 'border-red-500' : ''}>
              <SelectValue placeholder="Seleccionar método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
              <SelectItem value="tarjeta">Tarjeta de Crédito/Débito</SelectItem>
              <SelectItem value="mercadopago">MercadoPago</SelectItem>
              <SelectItem value="flow">Flow</SelectItem>
            </SelectContent>
          </Select>
          {errores.metodoPago && <p className="text-red-500 text-sm mt-1">{errores.metodoPago}</p>}
        </div>
        <div>
          <Label htmlFor="codigoDescuento">Código de Descuento</Label>
          <div className="flex gap-2">
            <Input
              id="codigoDescuento"
              value={formData.codigoDescuento}
              onChange={(e) => actualizarFormData('codigoDescuento', e.target.value)}
              placeholder="Ingresa tu código"
            />
            <Button type="button" variant="outline" onClick={validarCodigo}>
              Validar
            </Button>
          </div>
          {codigoValidado && formData.descuentoAplicado > 0 && (
            <p className="text-green-600 text-sm mt-1">
              ✓ Código válido - {formData.descuentoAplicado}% de descuento aplicado
            </p>
          )}
        </div>
      </div>
      
      {/* Resumen de Precios */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Resumen de Precios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal ({formData.pasajeros} pasajero{formData.pasajeros > 1 ? 's' : ''})</span>
            <span>{formatCurrency(formData.subtotal)}</span>
          </div>
          {formData.descuentoAplicado > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Descuento ({formData.descuentoAplicado}%)</span>
              <span>-{formatCurrency(formData.subtotal * formData.descuentoAplicado / 100)}</span>
            </div>
          )}
          <hr />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(formData.total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderPaso4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">¡Reserva Confirmada!</h3>
        <p className="text-gray-600">Tu reserva ha sido procesada exitosamente</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Reserva</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Cliente:</strong> {formData.nombre}</div>
            <div><strong>Email:</strong> {formData.email}</div>
            <div><strong>Destino:</strong> {DESTINOS.find(d => d.id === formData.destino)?.nombre}</div>
            <div><strong>Fecha:</strong> {formData.fechaViaje ? format(formData.fechaViaje, "PPP", { locale: es }) : ''}</div>
            <div><strong>Pasajeros:</strong> {formData.pasajeros}</div>
            <div><strong>Servicio:</strong> {formData.tipoServicio}</div>
            <div><strong>Método de Pago:</strong> {formData.metodoPago}</div>
            <div><strong>Total:</strong> {formatCurrency(formData.total)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Nueva Reserva</CardTitle>
              <CardDescription>Completa los siguientes pasos para crear una nueva reserva</CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>
          
          {/* Indicador de Pasos */}
          <div className="flex items-center justify-between mt-6">
            {PASOS.map((paso, index) => {
              const Icono = paso.icono
              const esActual = paso.id === pasoActual
              const esCompletado = paso.id < pasoActual
              
              return (
                <div key={paso.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    esCompletado ? 'bg-green-500 border-green-500 text-white' :
                    esActual ? 'border-blue-500 text-blue-500' : 'border-gray-300 text-gray-300'
                  }`}>
                    {esCompletado ? <Check className="w-5 h-5" /> : <Icono className="w-5 h-5" />}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${esActual ? 'text-blue-600' : 'text-gray-500'}`}>
                      Paso {paso.id}
                    </p>
                    <p className={`text-xs ${esActual ? 'text-blue-600' : 'text-gray-500'}`}>
                      {paso.titulo}
                    </p>
                  </div>
                  {index < PASOS.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${esCompletado ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardHeader>
        
        <CardContent>
          {pasoActual === 1 && renderPaso1()}
          {pasoActual === 2 && renderPaso2()}
          {pasoActual === 3 && renderPaso3()}
          {pasoActual === 4 && renderPaso4()}
        </CardContent>
        
        <div className="flex justify-between p-6 border-t">
          <Button
            variant="outline"
            onClick={pasoAnterior}
            disabled={pasoActual === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
          
          {pasoActual < 4 ? (
            <Button onClick={siguientePaso} className="flex items-center gap-2">
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={enviarFormulario} className="bg-green-600 hover:bg-green-700">
              Finalizar Reserva
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
