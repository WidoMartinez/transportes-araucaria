import { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import {
Card,
CardContent,
CardDescription,
CardHeader,
CardTitle,
} from "../../ui/card";
import {
Dialog,
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
} from "../../ui/dialog";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "../../ui/select";
import {
Plus,
Edit,
Trash2,
Image as ImageIcon,
Eye,
EyeOff,
Calendar,
MapPin,
Users,
  DollarSign,
  ArrowUpDown,
  Link,
  Copy,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { getBackendUrl } from "../../../lib/backend";

// Destinos base para fallback (lista completa de destinos turísticos)
const destinosBase = [
  { nombre: "Aeropuerto La Araucanía" },
  { nombre: "Temuco" },
  { nombre: "Pucón" },
  { nombre: "Villarrica" },
  { nombre: "Lican Ray" },
  { nombre: "Coñaripe" },
  { nombre: "Curarrehue" },
  { nombre: "Melipeuco" },
  { nombre: "Cunco" },
  { nombre: "Malalcahuello" },
  { nombre: "Corralco" },
  { nombre: "Lonquimay" },
  { nombre: "Conguillío" },
  { nombre: "Huilo Huilo" },
  { nombre: "Neltume" },
  { nombre: "Puerto Fuy" },
  { nombre: "Choshuenco" },
  { nombre: "Panguipulli" },
  { nombre: "Valdivia" },
  { nombre: "Osorno" },
  { nombre: "Puerto Varas" },
  { nombre: "Puerto Montt" },
];

/**
 * Panel de administración de promociones banner
 * Permite crear, editar, eliminar y ordenar banners promocionales
 */
export default function GestionPromociones() {
  const { accessToken } = useAuth();
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromocion, setEditingPromocion] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    tipo_viaje: "ida_vuelta",
    destino: "",
    origen: "Aeropuerto La Araucanía",
    max_pasajeros: "3",
    min_pasajeros: "1",
    activo: true,
    orden: "0",
    fecha_inicio: "",
    fecha_fin: "",
    hora_inicio: "",
    hora_fin: "",
    posicion_imagen: "center",
    permite_sillas: false,
    max_sillas: "0",
    valor_silla: "0",
    anticipacion_minima: "3",
  });
  const [imagenFile, setImagenFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [destinosDisponibles, setDestinosDisponibles] = useState([]);

  const loadDestinos = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/pricing`);
      if (response.ok) {
        const data = await response.json();
        // Usar 'destinos' (español) como en App.jsx, no 'destinations'
        const destinos = data.destinos || [];
        const nombresDestinos = destinos.map((d) => d.nombre).filter(Boolean);
        // Asegurar que "Aeropuerto La Araucanía" esté siempre disponible
        const destinosUnicos = [
          "Aeropuerto La Araucanía",
          ...nombresDestinos.filter((n) => n !== "Aeropuerto La Araucanía"),
        ];
        setDestinosDisponibles(destinosUnicos);
      } else {
        // Fallback a destinos base
        setDestinosDisponibles([
          "Aeropuerto La Araucanía",
          ...destinosBase.map((d) => d.nombre),
        ]);
      }
    } catch (error) {
      console.error("Error al cargar destinos:", error);
      // Fallback a destinos base
      setDestinosDisponibles([
        "Aeropuerto La Araucanía",
        ...destinosBase.map((d) => d.nombre),
      ]);
    }
  };

  // Cargar promociones
  useEffect(() => {
    if (accessToken) {
      loadPromociones();
    }
    loadDestinos();
  }, [accessToken]);

  // Efecto para manejar bloqueo de origen/destino según tipo de viaje
  useEffect(() => {
    if (formData.tipo_viaje === "desde_aeropuerto") {
      setFormData(prev => ({ ...prev, origen: "Aeropuerto La Araucanía" }));
    } else if (formData.tipo_viaje === "hacia_aeropuerto") {
      setFormData(prev => ({ ...prev, destino: "Aeropuerto La Araucanía" }));
    }
  }, [formData.tipo_viaje]);

  const loadPromociones = async () => {
    try {
      if (!accessToken) return;
      
      const response = await fetch(`${getBackendUrl()}/api/promociones-banner`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

if (response.ok) {
const data = await response.json();
setPromociones(data);
}
} catch (error) {
console.error("Error al cargar promociones:", error);
}
};

// Abrir diálogo para crear
const handleCreate = () => {
setEditingPromocion(null);
setFormData({
      nombre: "",
      precio: "",
      tipo_viaje: "ida_vuelta",
      destino: "",
      origen: "Aeropuerto La Araucanía",
      max_pasajeros: "3",
      min_pasajeros: "1",
      activo: true,
      orden: "0",
      fecha_inicio: "",
      fecha_fin: "",
      hora_inicio: "",
      hora_fin: "",
      posicion_imagen: "center",
      permite_sillas: false,
      max_sillas: "0",
      valor_silla: "0",
      anticipacion_minima: "3",
    });
setImagenFile(null);
setPreviewUrl("");
setIsDialogOpen(true);
};

// Abrir diálogo para editar
const handleEdit = (promocion) => {
setEditingPromocion(promocion);
setFormData({
      nombre: promocion.nombre,
      precio: promocion.precio.toString(),
      tipo_viaje: promocion.tipo_viaje,
      destino: promocion.destino,
      origen: promocion.origen,
      max_pasajeros: promocion.max_pasajeros.toString(),
      min_pasajeros: (promocion.min_pasajeros || "1").toString(),
      activo: promocion.activo,
      orden: promocion.orden.toString(),
      fecha_inicio: promocion.fecha_inicio || "",
      fecha_fin: promocion.fecha_fin || "",
      hora_inicio: promocion.hora_inicio || "",
      hora_fin: promocion.hora_fin || "",
      posicion_imagen: promocion.posicion_imagen || "center",
      permite_sillas: promocion.permite_sillas || false,
      max_sillas: (promocion.max_sillas || "0").toString(),
      valor_silla: (promocion.valor_silla || "0").toString(),
      anticipacion_minima: (promocion.anticipacion_minima || "3").toString(),
    });
setImagenFile(null);
setPreviewUrl(`${getBackendUrl()}${promocion.imagen_url}`);
setIsDialogOpen(true);
};

// Manejar cambio en archivo de imagen
const handleImageChange = (e) => {
const file = e.target.files[0];
if (file) {
setImagenFile(file);
const reader = new FileReader();
reader.onloadend = () => {
setPreviewUrl(reader.result);
};
reader.readAsDataURL(file);
}
};

// Guardar promoción (crear o editar)
const handleSave = async () => {
  try {
    setLoading(true);
    if (!accessToken) {
      alert("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.");
      return;
    }

// Validar campos requeridos
if (!formData.nombre || !formData.precio || !formData.destino) {
alert("Por favor, complete todos los campos requeridos");
return;
}

      // Validar origen != destino
      if (formData.origen === formData.destino) {
        alert("El origen y el destino no pueden ser iguales");
        return;
      }

// Validar imagen en crear
if (!editingPromocion && !imagenFile) {
alert("Por favor, seleccione una imagen");
return;
}

// Crear FormData para enviar con archivo
const formDataToSend = new FormData();
formDataToSend.append("nombre", formData.nombre);
formDataToSend.append("precio", formData.precio);
formDataToSend.append("tipo_viaje", formData.tipo_viaje);
formDataToSend.append("destino", formData.destino);
formDataToSend.append("origen", formData.origen);
      formDataToSend.append("max_pasajeros", formData.max_pasajeros);
      formDataToSend.append("min_pasajeros", formData.min_pasajeros);
      formDataToSend.append("activo", formData.activo);
      formDataToSend.append("orden", formData.orden);
      formDataToSend.append("fecha_inicio", formData.fecha_inicio);
      formDataToSend.append("fecha_fin", formData.fecha_fin);
      formDataToSend.append("hora_inicio", formData.hora_inicio);
      formDataToSend.append("hora_fin", formData.hora_fin);
      formDataToSend.append("posicion_imagen", formData.posicion_imagen);
      formDataToSend.append("permite_sillas", formData.permite_sillas);
      formDataToSend.append("max_sillas", formData.max_sillas);
      formDataToSend.append("valor_silla", formData.valor_silla);
      formDataToSend.append("anticipacion_minima", formData.anticipacion_minima);

if (imagenFile) {
formDataToSend.append("imagen", imagenFile);
}

const url = editingPromocion
? `${getBackendUrl()}/api/promociones-banner/${editingPromocion.id}`
: `${getBackendUrl()}/api/promociones-banner`;

const method = editingPromocion ? "PUT" : "POST";

const response = await fetch(url, {
  method,
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
  body: formDataToSend,
});

if (!response.ok) {
const error = await response.json();
throw new Error(error.error || "Error al guardar promoción");
}

await loadPromociones();
		loadDestinos();
setIsDialogOpen(false);
alert(
editingPromocion
? "Promoción actualizada exitosamente"
: "Promoción creada exitosamente"
);
} catch (error) {
console.error("Error al guardar promoción:", error);
alert(error.message || "Error al guardar promoción");
} finally {
setLoading(false);
}
};

// Eliminar promoción
const handleDelete = async (id) => {
if (!confirm("¿Está seguro que desea eliminar esta promoción?")) {
return;
}

    try {
      setLoading(true);
      if (!accessToken) {
        alert("Tu sesión ha expirado");
        return;
      }

      const response = await fetch(
        `${getBackendUrl()}/api/promociones-banner/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

if (!response.ok) {
throw new Error("Error al eliminar promoción");
}

await loadPromociones();
		loadDestinos();
alert("Promoción eliminada exitosamente");
} catch (error) {
console.error("Error al eliminar promoción:", error);
alert("Error al eliminar promoción");
} finally {
setLoading(false);
}
};

// Alternar estado activo
const toggleActivo = async (id, activo) => {
    try {
      if (!accessToken) return;

      const formDataToSend = new FormData();
      formDataToSend.append("activo", !activo);

      const response = await fetch(
        `${getBackendUrl()}/api/promociones-banner/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formDataToSend,
        }
      );

if (!response.ok) {
throw new Error("Error al actualizar estado");
}

await loadPromociones();
		loadDestinos();
} catch (error) {
console.error("Error al actualizar estado:", error);
alert("Error al actualizar estado");
}
};
  const copyPromoLink = (id) => {
    const link = `${window.location.origin}/?promo=${id}`;
    navigator.clipboard.writeText(link);
    alert("Link copiado al portapapeles: " + link);
  };

return (
<div className="space-y-6">
{/* Header */}
<div className="flex justify-between items-center">
<div>
<h2 className="text-3xl font-bold text-gray-900">
Gestión de Promociones Banner
</h2>
<p className="text-gray-600 mt-1">
Administra los banners promocionales del sitio web
</p>
</div>
<Button onClick={handleCreate} className="gap-2">
<Plus className="h-4 w-4" />
Nueva Promoción
</Button>
</div>

{/* Lista de promociones */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{promociones.map((promo) => (
<Card key={promo.id} className="overflow-hidden">
<div className="relative">
{/* Imagen preview */}
<img
src={`${getBackendUrl()}${promo.imagen_url}`}
alt={promo.nombre}
className="w-full h-48 object-cover"
style={{ objectPosition: promo.posicion_imagen || "center" }}
/>

{/* Badge de estado */}
<div className="absolute top-2 right-2">
{promo.activo ? (
<span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
<Eye className="h-3 w-3" />
Activo
</span>
) : (
<span className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
<EyeOff className="h-3 w-3" />
Inactivo
</span>
)}
</div>

{/* Badge de orden */}
<div className="absolute top-2 left-2 flex gap-1">
<span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 shadow-sm">
<ArrowUpDown className="h-3 w-3" />
{promo.orden}
</span>
<span className="bg-black/70 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-sm backdrop-blur-sm">
ID: {promo.id}
</span>
</div>
</div>

<CardHeader>
<CardTitle className="text-lg">{promo.nombre}</CardTitle>
<CardDescription>
<div className="space-y-1 mt-2">
<div className="flex items-center gap-2 text-sm">
<MapPin className="h-4 w-4" />
{promo.origen} → {promo.destino}
</div>
<div className="flex items-center gap-2 text-sm">
<DollarSign className="h-4 w-4" />
                          ${promo.precio.toLocaleString("es-CL")} •{" "}
                          {promo.tipo_viaje === "ida_vuelta" 
                            ? "Ida y Vuelta" 
                            : promo.tipo_viaje === "desde_aeropuerto" 
                              ? "Desde Aeropuerto" 
                              : "Hacia Aeropuerto"}
                        </div>
<div className="flex items-center gap-2 text-sm">
<Users className="h-4 w-4" />
                          {promo.min_pasajeros && promo.min_pasajeros > 1 ? `${promo.min_pasajeros} - ` : ""}
                          Hasta {promo.max_pasajeros} pasajeros
                        </div>
{(promo.fecha_inicio || promo.fecha_fin) && (
<div className="flex items-center gap-2 text-sm">
<Calendar className="h-4 w-4" />
{promo.fecha_inicio &&
new Date(promo.fecha_inicio).toLocaleDateString("es-CL")}
{promo.fecha_fin &&
` - ${new Date(promo.fecha_fin).toLocaleDateString("es-CL")}`}
</div>
)}
</div>
</CardDescription>
</CardHeader>

<CardContent className="space-y-2">
<div className="flex items-center justify-between">
<span className="text-sm text-gray-600">Mostrar en sitio</span>
<Switch
									aria-label="Activar o desactivar promoción"
checked={promo.activo}
onCheckedChange={() => toggleActivo(promo.id, promo.activo)}
/>
</div>

<div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyPromoLink(promo.id)}
                title="Copiar Link Directo"
              >
                <Link className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleEdit(promo)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(promo.id)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
</CardContent>
</Card>
))}

{promociones.length === 0 && (
<div className="col-span-full text-center py-12 text-gray-500">
No hay promociones creadas. Haz clic en "Nueva Promoción" para comenzar.
</div>
)}
</div>

{/* Dialog para crear/editar */}
<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
<DialogHeader>
<DialogTitle className="flex justify-between items-center">
<span>{editingPromocion ? "Editar Promoción" : "Nueva Promoción"}</span>
{editingPromocion && (
<span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
ID: {editingPromocion.id}
</span>
)}
</DialogTitle>
<DialogDescription>
{editingPromocion
? "Modifica los datos de la promoción"
: "Crea una nueva promoción banner con imagen"}
</DialogDescription>
</DialogHeader>

        <div className="space-y-4">
          {/* Link directo (Solo en edición) */}
          {editingPromocion && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                  <Link className="h-3 w-3" /> Link Directo (Google Ads)
                </p>
                <code className="text-xs text-blue-600 block truncate">
                  {`${window.location.origin}/?promo=${editingPromocion.id}`}
                </code>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                onClick={() => copyPromoLink(editingPromocion.id)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Doble vista previa: PC y Móvil */}
{previewUrl && (
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-xl p-4 bg-gray-50/50 shadow-inner">
<div className="space-y-2">
<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
<ImageIcon className="h-3 w-3" /> Vista Desktop (21:9)
</p>
<div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
<img 
src={previewUrl} 
alt="Preview PC" 
className="absolute inset-0 w-full h-full object-cover" 
style={{ 
  objectPosition: formData.posicion_imagen || "center",
  transformOrigin: formData.posicion_imagen || "center" 
}}
/>
</div>
</div>

<div className="space-y-2">
<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
<Plus className="h-3 w-3 rotate-45" /> Vista Móvil (4:5)
</p>
<div className="relative aspect-[4/5] h-48 mx-auto overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
<img 
src={previewUrl} 
alt="Preview Mobile" 
className="absolute inset-0 w-full h-full object-cover" 
style={{ 
  objectPosition: formData.posicion_imagen || "center",
  transformOrigin: formData.posicion_imagen || "center" 
}}
/>
</div>
</div>
</div>
)}

{/* Upload de imagen */}
<div className="space-y-2">
<Label htmlFor="imagen">
Imagen del Banner {!editingPromocion && <span className="text-red-500">*</span>}
</Label>
<div className="flex items-center gap-2">
<Input
id="imagen"
type="file"
accept="image/jpeg,image/png,image/gif,image/webp"
onChange={handleImageChange}
className="flex-1"
/>
<ImageIcon className="h-5 w-5 text-gray-400" />
</div>
<p className="text-xs text-gray-500">
Formatos: JPG, PNG, GIF, WebP. Máximo 5MB.
</p>
</div>

{/* Datos básicos */}
<div className="grid grid-cols-2 gap-4">
<div className="col-span-2 space-y-2">
<Label htmlFor="nombre">
Nombre de la Promoción <span className="text-red-500">*</span>
</Label>
<Input
id="nombre"
value={formData.nombre}
onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
placeholder="Ej: Viaje a Pucón - 30% OFF"
/>
</div>

<div className="space-y-2">
<Label htmlFor="precio">
Precio (CLP) <span className="text-red-500">*</span>
</Label>
<Input
id="precio"
type="number"
value={formData.precio}
onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
placeholder="25000"
/>
</div>

<div className="space-y-2">
<Label htmlFor="tipo_viaje">Tipo de Viaje</Label>
<Select
value={formData.tipo_viaje}
onValueChange={(value) =>
setFormData({ ...formData, tipo_viaje: value })
}
>
<SelectTrigger>
<SelectValue />
</SelectTrigger>
              <SelectContent>
                <SelectItem value="desde_aeropuerto">Desde Aeropuerto</SelectItem>
                <SelectItem value="hacia_aeropuerto">Hacia Aeropuerto</SelectItem>
                <SelectItem value="ida_vuelta">Ida y Vuelta</SelectItem>
              </SelectContent>
</Select>
</div>

<div className="space-y-2">
<Label htmlFor="origen">Origen</Label>
              <Select
                value={formData.origen}
                disabled={formData.tipo_viaje === "desde_aeropuerto"}
                onValueChange={(value) => setFormData({ ...formData, origen: value })}
              >
<SelectTrigger>
<SelectValue placeholder="Seleccionar origen" />
</SelectTrigger>
<SelectContent>
{destinosDisponibles.map((destino) => (
<SelectItem key={destino} value={destino}>
{destino}
</SelectItem>
))}
</SelectContent>
</Select>
</div>

<div className="space-y-2">
<Label htmlFor="destino">
Destino <span className="text-red-500">*</span>
</Label>
              <Select
                value={formData.destino}
                disabled={formData.tipo_viaje === "hacia_aeropuerto"}
                onValueChange={(value) => setFormData({ ...formData, destino: value })}
              >
<SelectTrigger>
<SelectValue placeholder="Seleccionar destino" />
</SelectTrigger>
<SelectContent>
{destinosDisponibles.map((destino) => (
<SelectItem key={destino} value={destino}>
{destino}
</SelectItem>
))}
</SelectContent>
</Select>
</div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_pasajeros">Mín. Pasajeros</Label>
                <Input
                  id="min_pasajeros"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.min_pasajeros}
                  onChange={(e) =>
                    setFormData({ ...formData, min_pasajeros: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_pasajeros">Máx. Pasajeros</Label>
                <Input
                  id="max_pasajeros"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.max_pasajeros}
                  onChange={(e) =>
                    setFormData({ ...formData, max_pasajeros: e.target.value })
                  }
                />
              </div>
            </div>

<div className="space-y-2">
<Label htmlFor="orden">Orden de Visualización</Label>
<Input
id="orden"
type="number"
value={formData.orden}
onChange={(e) => setFormData({ ...formData, orden: e.target.value })}
placeholder="0"
/>
<p className="text-xs text-gray-500">Menor número = mayor prioridad</p>
</div>

<div className="space-y-2">
<Label htmlFor="posicion_imagen">Posición de Imagen</Label>
<Select
value={formData.posicion_imagen}
onValueChange={(value) => setFormData({ ...formData, posicion_imagen: value })}
>
<SelectTrigger>
<SelectValue placeholder="Seleccionar posición" />
</SelectTrigger>
<SelectContent>
<SelectItem value="center">Centrado (Default)</SelectItem>
<SelectItem value="top">Superior</SelectItem>
<SelectItem value="bottom">Inferior</SelectItem>
<SelectItem value="left">Izquierda</SelectItem>
<SelectItem value="right">Derecha</SelectItem>
<SelectItem value="top center">Superior Centro</SelectItem>
<SelectItem value="bottom center">Inferior Centro</SelectItem>
<SelectItem value="center left">Centro Izquierda</SelectItem>
<SelectItem value="center right">Centro Derecha</SelectItem>
<SelectItem value="top left">Superior Izquierda</SelectItem>
<SelectItem value="top right">Superior Derecha</SelectItem>
<SelectItem value="bottom left">Inferior Izquierda</SelectItem>
<SelectItem value="bottom right">Inferior Derecha</SelectItem>
</SelectContent>
</Select>
                <p className="text-xs text-gray-500">Útil si el contenido importante de la foto no está al centro.</p>
            </div>

            {/* Configuración Avanzada - Full Width */}
            <div className="col-span-2 border-t pt-4 mt-2">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-gray-100 p-1 rounded">⚙️</span> Configuración Avanzada
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                
                <div className="space-y-4">
                   <div className="space-y-2">
                     <Label htmlFor="anticipacion_minima" className="font-semibold text-gray-700">Anticipación Mínima</Label>
                     <div className="relative">
                       <Input
                         id="anticipacion_minima"
                         type="number"
                         min="0"
                         value={formData.anticipacion_minima}
                         onChange={(e) => setFormData({ ...formData, anticipacion_minima: e.target.value })}
                         className="pl-5"
                       />
                       <span className="absolute right-3 top-2.5 text-gray-400 text-xs font-medium">Horas</span>
                     </div>
                     <p className="text-[11px] text-gray-500 leading-tight">Tiempo mínimo entre la reserva y el viaje.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="space-y-0.5">
                      <Label htmlFor="permite_sillas" className="text-sm font-semibold text-gray-700 cursor-pointer">Sillas Infantiles</Label>
                      <p className="text-[11px] text-gray-500">Permitir agregar sillas a la reserva</p>
                    </div>
                    <Switch
                      id="permite_sillas"
                      checked={formData.permite_sillas}
                      onCheckedChange={(checked) => setFormData({ ...formData, permite_sillas: checked })}
                    />
                  </div>

                  {formData.permite_sillas && (
                    <div className="grid grid-cols-2 gap-3 pl-2 border-l-2 border-green-500/20 animate-in fade-in slide-in-from-top-1">
                      <div className="space-y-1.5">
                        <Label htmlFor="max_sillas" className="text-xs font-medium text-gray-600">Máx. Cantidad</Label>
                        <Input
                          id="max_sillas"
                          type="number"
                          min="1"
                          value={formData.max_sillas}
                          onChange={(e) => setFormData({ ...formData, max_sillas: e.target.value })}
                          className="h-9 bg-white"
                        />
                      </div>
                       <div className="space-y-1.5">
                        <Label htmlFor="valor_silla" className="text-xs font-medium text-gray-600">Valor Unitario</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-2 text-gray-400 text-xs">$</span>
                          <Input
                            id="valor_silla"
                            type="number"
                            min="0"
                            value={formData.valor_silla}
                            onChange={(e) => setFormData({ ...formData, valor_silla: e.target.value })}
                             className="h-9 pl-5 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        {/* Fechas de vigencia */}
        <div className="space-y-2">
          <Label>Vigencia y Horarios (Opcional)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_inicio" className="text-sm text-gray-600">
                Desde Fecha
              </Label>
              <Input
                id="fecha_inicio"
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) =>
                  setFormData({ ...formData, fecha_inicio: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_fin" className="text-sm text-gray-600">
                Hasta Fecha
              </Label>
              <Input
                id="fecha_fin"
                type="date"
                value={formData.fecha_fin}
                onChange={(e) =>
                  setFormData({ ...formData, fecha_fin: e.target.value })
                }
                min={formData.fecha_inicio}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora_inicio" className="text-sm text-gray-600">
                Hora Inicio
              </Label>
              <Select
                value={formData.hora_inicio}
                onValueChange={(value) =>
                  setFormData({ ...formData, hora_inicio: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="--:--" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                   {/* Generar opciones cada 15 min */}
                   {Array.from({ length: 96 }).map((_, i) => {
                      const h = Math.floor(i / 4).toString().padStart(2, '0');
                      const m = ((i % 4) * 15).toString().padStart(2, '0');
                      const time = `${h}:${m}`; // "00:00", "00:15"...
                      // Formato HH:MM:00 para guardar en DB TIME
                      const val = `${time}:00`; 
                      return (
                        <SelectItem key={val} value={val}>
                          {time}
                        </SelectItem>
                      );
                   })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora_fin" className="text-sm text-gray-600">
                Hora Fin
              </Label>
               <Select
                value={formData.hora_fin}
                onValueChange={(value) =>
                  setFormData({ ...formData, hora_fin: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="--:--" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                   {Array.from({ length: 96 }).map((_, i) => {
                      const h = Math.floor(i / 4).toString().padStart(2, '0');
                      const m = ((i % 4) * 15).toString().padStart(2, '0');
                      const time = `${h}:${m}`;
                      const val = `${time}:00`;
                      return (
                        <SelectItem key={val} value={val}>
                          {time}
                        </SelectItem>
                      );
                   })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Si no se especifica, la promoción estará siempre disponible en cualquier horario
          </p>
        </div>

{/* Estado activo */}
<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
<div>
<Label htmlFor="activo" className="font-semibold">
Promoción Activa
</Label>
<p className="text-sm text-gray-600">
Mostrar en el carrusel del sitio web
</p>
</div>
<Switch
									aria-label="Activar o desactivar promoción"
id="activo"
checked={formData.activo}
onCheckedChange={(checked) =>
setFormData({ ...formData, activo: checked })
}
/>
</div>
</div>

<DialogFooter>
<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
Cancelar
</Button>
<Button onClick={handleSave} disabled={loading}>
{loading ? "Guardando..." : editingPromocion ? "Actualizar" : "Crear"}
</Button>
</DialogFooter>
</DialogContent>
</Dialog>
</div>
);
}
