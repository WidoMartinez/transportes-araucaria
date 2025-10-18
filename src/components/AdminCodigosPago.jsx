import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { destinosBase } from "../data/destinos";

function AdminCodigosPago() {
  const [codigosPago, setCodigosPago] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCrearDialog, setShowCrearDialog] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [formData, setFormData] = useState({
    origen: "Aeropuerto La Araucanía",
    otroOrigen: "",
    destino: "",
    otroDestino: "",
    monto: "",
    descripcion: "",
    vehiculo: "",
    pasajeros: 1,
    idaVuelta: false,
    fechaVencimiento: "",
    usosMaximos: 1,
    observaciones: "",
  });
  const backendUrl =
    import.meta.env.VITE_API_URL || "https://transportes-araucaria.onrender.com";
  const adminToken =
    import.meta.env.VITE_ADMIN_TOKEN ||
    (typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "");
  const [destinosOpciones, setDestinosOpciones] = useState(
    destinosBase.map((d) => d.nombre)
  );

  // Carga dinámica de destinos desde el backend (misma lógica del Hero)
  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      try {
        const resp = await fetch(`${backendUrl}/pricing`);
        if (!resp.ok) return;
        const data = await resp.json();
        const lista = Array.isArray(data?.destinos)
          ? data.destinos
              .map((d) => (typeof d?.nombre === "string" ? d.nombre : null))
              .filter(Boolean)
          : [];
        if (!cancelado && lista.length > 0) setDestinosOpciones(lista);
      } catch {
        // fallback a destinosBase
      }
    };
    cargar();
    return () => {
      cancelado = true;
    };
  }, [backendUrl]);

  const origenes = useMemo(
    () => ["Aeropuerto La Araucanía", ...destinosOpciones, "Otro"],
    [destinosOpciones]
  );
  const destinos = useMemo(
    // Evitar que destino repita el origen seleccionado
    () => ["Aeropuerto La Araucanía", ...destinosOpciones, "Otro"],
    [destinosOpciones]
  );
  const destinosFiltrados = useMemo(() => {
    return destinos.filter((d) => d !== formData.origen);
  }, [destinos, formData.origen]);
  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(
      value || 0
    );
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const cargarCodigos = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${backendUrl}/api/codigos-pago`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Error al cargar códigos");
        return;
      }
      setCodigosPago(data.codigosPago || []);
    } catch (e) {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    cargarCodigos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };
  const generarCodigoLocal = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/1/O/I
    const rand = Array.from({ length: 6 }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join("");
    return `PX-${rand}`;
  };
  const crearCodigo = async () => {
    // Validaciones mínimas
    const origenResuelto =
      formData.origen === "Otro" ? (formData.otroOrigen || "").trim() : formData.origen;
    const destinoResuelto =
      formData.destino === "Otro" ? (formData.otroDestino || "").trim() : formData.destino;
    if (!destinoResuelto) {
      setError("El destino es requerido");
      return;
    }
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }
    setProcesando(true);
    setError("");
    try {
      const payload = {
        codigo: generarCodigoLocal(),
        origen: origenResuelto,
        destino: destinoResuelto,
        monto: parseFloat(formData.monto),
        descripcion: formData.descripcion || "",
        vehiculo: formData.vehiculo || "",
        pasajeros: parseInt(formData.pasajeros) || 1,
        idaVuelta: Boolean(formData.idaVuelta),
        fechaVencimiento: formData.fechaVencimiento || undefined,
        usosMaximos: parseInt(formData.usosMaximos) || 1,
        observaciones: formData.observaciones || "",
      };
      const response = await fetch(`${backendUrl}/api/codigos-pago`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        setError(data.message || "Error al crear código");
        return;
      }
      setFormData({
        origen: "Aeropuerto La Araucanía",
        otroOrigen: "",
        destino: "",
        otroDestino: "",
        monto: "",
        descripcion: "",
        vehiculo: "",
        pasajeros: 1,
        idaVuelta: false,
        fechaVencimiento: "",
        usosMaximos: 1,
        observaciones: "",
      });
      setShowCrearDialog(false);
      cargarCodigos();
    } catch {
      setError("Error al conectar con el servidor");
    } finally {
      setProcesando(false);
    }
  };
  const eliminarCodigo = async (codigo) => {
    if (!confirm(`¿Estás seguro de eliminar el código ${codigo}?`)) return;
    try {
      const response = await fetch(`${backendUrl}/api/codigos-pago/${codigo}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Error al eliminar código");
        return;
      }
      cargarCodigos();
    } catch {
      setError("Error al conectar con el servidor");
    }
  };
  const getEstadoBadge = (estado) => {
    const badges = {
      activo: <Badge className="bg-green-500">Activo</Badge>,
      usado: <Badge variant="secondary">Usado</Badge>,
      vencido: <Badge variant="destructive">Vencido</Badge>,
      cancelado: <Badge variant="outline">Cancelado</Badge>,
    };
    return badges[estado] || <Badge>{estado}</Badge>;
  };
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Códigos de Pago</h1>
          <p className="text-gray-600">Genera códigos para enviar por WhatsApp</p>
        </div>
        <Button onClick={() => setShowCrearDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Código
        </Button>
      </div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Códigos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
          ) : codigosPago.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay códigos registrados</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Ruta</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Vence</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codigosPago.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-bold">{c.codigo}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{c.origen}</div>
                          <div className="text-gray-500">↓</div>
                          <div>{c.destino}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(c.monto)}</TableCell>
                      <TableCell>{getEstadoBadge(c.estado)}</TableCell>
                      <TableCell>
                        {c.usosActuales} / {c.usosMaximos}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(c.fechaVencimiento)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarCodigo(c.codigo)}
                          disabled={c.estado === "usado"}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={showCrearDialog} onOpenChange={setShowCrearDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Código de Pago</DialogTitle>
            <DialogDescription>
              Completa origen, destino y monto. El código se generará automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monto">Monto</Label>
                <Input
                  id="monto"
                  name="monto"
                  type="number"
                  value={formData.monto}
                  onChange={handleInputChange}
                  placeholder="35000"
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="origen">Origen</Label>
                <select
                  id="origen"
                  name="origen"
                  value={formData.origen}
                  onChange={handleInputChange}
                  className="h-10 border rounded px-3"
                >
                  {origenes.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {formData.origen === "Otro" && (
                  <Input
                    id="otroOrigen"
                    name="otroOrigen"
                    value={formData.otroOrigen}
                    onChange={handleInputChange}
                    placeholder="Especifica el origen"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="destino">Destino</Label>
                <select
                  id="destino"
                  name="destino"
                  value={formData.destino}
                  onChange={handleInputChange}
                  className="h-10 border rounded px-3"
                >
                  {destinosFiltrados.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {formData.destino === "Otro" && (
                  <Input
                    id="otroDestino"
                    name="otroDestino"
                    value={formData.otroDestino}
                    onChange={handleInputChange}
                    placeholder="Especifica el destino"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehiculo">Vehículo (opcional)</Label>
                <Input
                  id="vehiculo"
                  name="vehiculo"
                  value={formData.vehiculo}
                  onChange={handleInputChange}
                  placeholder="Sedan, Van, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pasajeros">Pasajeros</Label>
                <Input
                  id="pasajeros"
                  name="pasajeros"
                  type="number"
                  value={formData.pasajeros}
                  onChange={handleInputChange}
                  min="1"
                  max="15"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usosMaximos">Usos Máximos</Label>
                <Input
                  id="usosMaximos"
                  name="usosMaximos"
                  type="number"
                  value={formData.usosMaximos}
                  onChange={handleInputChange}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
                <Input
                  id="fechaVencimiento"
                  name="fechaVencimiento"
                  type="datetime-local"
                  value={formData.fechaVencimiento}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Descripción del servicio..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Input
                  id="observaciones"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  placeholder="Notas internas..."
                />
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCrearDialog(false)}
                disabled={procesando}
              >
                Cancelar
              </Button>
              <Button onClick={crearCodigo} disabled={procesando}>
                {procesando ? (
                  <>
                    <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Código"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminCodigosPago;