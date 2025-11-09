import React, { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
} from "./ui/table";
import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
} from "./ui/dialog";
import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
} from "./ui/alert-dialog";
import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { getBackendUrl } from "../lib/backend";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { formatCurrency } from "../lib/utils";
import {
        Search,
        Plus,
        Edit,
        Trash2,
        Package,
        Sparkles,
        RefreshCw,
        AlertCircle,
} from "lucide-react";

const API_BASE_URL = getBackendUrl() || "https://transportes-araucaria.onrender.com";

const estadoBadge = {
        true: "bg-green-500",
        false: "bg-gray-500",
};

const estadoLabel = {
        true: "Disponible",
        false: "No disponible",
};

const formularioInicial = {
        nombre: "",
        descripcion: "",
        categoria: "general",
        precio: "",
        disponible: true,
        stock: "",
        imagenUrl: "",
        orden: "",
        disponibleEnRuta: "",
        disponibleEnVehiculo: "",
};

const convertirListaAEntrada = (valor) => {
        if (Array.isArray(valor)) {
                return valor.join(", ");
        }
        if (valor === null || valor === undefined) {
                return "";
        }
        if (typeof valor === "string") {
                return valor;
        }
        if (typeof valor === "object") {
                return Object.values(valor)
                        .map((item) => (item != null ? String(item).trim() : ""))
                        .filter((item) => item.length > 0)
                        .join(", ");
        }
        return "";
};

const normalizarListaParaEnvio = (valor) => {
        if (Array.isArray(valor)) {
                return valor;
        }
        if (typeof valor !== "string") {
                return null;
        }
        const texto = valor.trim();
        if (!texto) {
                return null;
        }
        return texto
                .split(/[,;\n]/)
                .map((item) => item.trim())
                .filter((item) => item.length > 0);
};

function AdminProductos() {
        const { authenticatedFetch } = useAuthenticatedFetch();
        const [productos, setProductos] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState("");
        const [searchTerm, setSearchTerm] = useState("");
        const [filterCategoria, setFilterCategoria] = useState("todas");
        const [filterDisponibilidad, setFilterDisponibilidad] = useState("todas");
        const [showDialog, setShowDialog] = useState(false);
        const [showDeleteDialog, setShowDeleteDialog] = useState(false);
        const [selectedProducto, setSelectedProducto] = useState(null);
        const [formData, setFormData] = useState(formularioInicial);
        const [saving, setSaving] = useState(false);
        const [deleting, setDeleting] = useState(false);
        const [toggling, setToggling] = useState({});

        useEffect(() => {
                fetchProductos();
        }, []);

        const fetchProductos = async () => {
                try {
                        setLoading(true);
                        setError("");
                        const response = await authenticatedFetch(`/api/productos`, {
                                method: "GET",
                        });
                        const data = await response.json();

                        if (!response.ok) {
                                throw new Error(data.error || "No se pudieron cargar los productos");
                        }

                        setProductos(data.productos || []);
                } catch (err) {
                        console.error("Error cargando productos:", err);
                        setError(err.message || "Error inesperado al cargar los productos");
                } finally {
                        setLoading(false);
                }
        };

        const handleOpenDialog = (producto = null) => {
                if (producto) {
                        setSelectedProducto(producto);
                        setFormData({
                                nombre: producto.nombre || "",
                                descripcion: producto.descripcion || "",
                                categoria: producto.categoria || "general",
                                precio:
                                        producto.precio !== undefined && producto.precio !== null
                                                ? String(producto.precio)
                                                : "",
                                disponible: producto.disponible ?? true,
                                stock:
                                        producto.stock !== undefined && producto.stock !== null
                                                ? String(producto.stock)
                                                : "",
                                imagenUrl: producto.imagenUrl || "",
                                orden:
                                        producto.orden !== undefined && producto.orden !== null
                                                ? String(producto.orden)
                                                : "",
                                disponibleEnRuta: convertirListaAEntrada(producto.disponibleEnRuta),
                                disponibleEnVehiculo: convertirListaAEntrada(
                                        producto.disponibleEnVehiculo
                                ),
                        });
                } else {
                        setSelectedProducto(null);
                        setFormData(formularioInicial);
                }
                setShowDialog(true);
        };

        const handleCloseDialog = () => {
                if (saving) return;
                setShowDialog(false);
                setSelectedProducto(null);
                setFormData(formularioInicial);
        };

        const handleInputChange = (field, value) => {
                setFormData((prev) => ({ ...prev, [field]: value }));
        };

        const handleSubmit = async (event) => {
                event.preventDefault();
                if (saving) return;

                try {
                        if (!formData.nombre.trim()) {
                                alert("El nombre del producto es obligatorio");
                                return;
                        }

                        const url = selectedProducto
                                ? `/api/productos/${selectedProducto.id}`
                                : `/api/productos`;
                        const method = selectedProducto ? "PUT" : "POST";

                        const precioNormalizado =
                                formData.precio !== ""
                                        ? Number.parseFloat(formData.precio)
                                        : 0;
                        if (Number.isNaN(precioNormalizado) || precioNormalizado < 0) {
                                alert("El precio debe ser un número válido mayor o igual a 0");
                                return;
                        }

                        const stockNormalizado =
                                formData.stock !== ""
                                        ? Number.parseInt(formData.stock, 10)
                                        : null;
                        if (
                                stockNormalizado !== null &&
                                (Number.isNaN(stockNormalizado) || stockNormalizado < 0)
                        ) {
                                alert("El stock debe ser un número entero mayor o igual a 0");
                                return;
                        }

                        const ordenNormalizado =
                                formData.orden !== ""
                                        ? Number.parseInt(formData.orden, 10)
                                        : null;
                        if (ordenNormalizado !== null && Number.isNaN(ordenNormalizado)) {
                                alert("El orden debe ser un número entero válido");
                                return;
                        }

                        const payload = {
                                nombre: formData.nombre.trim(),
                                descripcion: formData.descripcion,
                                categoria: formData.categoria || "general",
                                precio: precioNormalizado,
                                disponible: formData.disponible,
                                stock: stockNormalizado,
                                imagenUrl: formData.imagenUrl.trim() || null,
                                orden: ordenNormalizado,
                                disponibleEnRuta: normalizarListaParaEnvio(
                                        formData.disponibleEnRuta
                                ),
                                disponibleEnVehiculo: normalizarListaParaEnvio(
                                        formData.disponibleEnVehiculo
                                ),
                        };

                        setSaving(true);

                        const response = await authenticatedFetch(url, {
                                method,
                                body: JSON.stringify(payload),
                        });

                        const data = await response.json();

                        if (!response.ok) {
                                throw new Error(data.error || "Error al guardar el producto");
                        }

                        await fetchProductos();
                        handleCloseDialog();
                } catch (err) {
                        console.error("Error guardando producto:", err);
                        alert(err.message || "Error inesperado al guardar el producto");
                } finally {
                        setSaving(false);
                }
        };

        const handleDelete = async () => {
                if (!selectedProducto || deleting) return;
                try {
                        setDeleting(true);
                        const response = await authenticatedFetch(
                                `/api/productos/${selectedProducto.id}`,
                                {
                                        method: "DELETE",
                                }
                        );

                        const data = await response.json();

                        if (!response.ok) {
                                throw new Error(data.error || "No fue posible eliminar el producto");
                        }

                        await fetchProductos();
                        setShowDeleteDialog(false);
                        setSelectedProducto(null);
                } catch (err) {
                        console.error("Error eliminando producto:", err);
                        alert(err.message || "Error inesperado al eliminar el producto");
                } finally {
                        setDeleting(false);
                }
        };

        const handleToggleDisponible = async (producto) => {
                if (!producto) return;
                try {
                        setToggling((prev) => ({ ...prev, [producto.id]: true }));

                        const response = await authenticatedFetch(`/api/productos/${producto.id}`, {
                                method: "PUT",
                                body: JSON.stringify({ disponible: !producto.disponible }),
                        });

                        const data = await response.json();

                        if (!response.ok) {
                                throw new Error(data.error || "No fue posible actualizar la disponibilidad");
                        }

                        await fetchProductos();
                } catch (err) {
                        console.error("Error actualizando disponibilidad:", err);
                        alert(err.message || "Error al cambiar la disponibilidad del producto");
                } finally {
                        setToggling((prev) => ({ ...prev, [producto.id]: false }));
                }
        };

        const categorias = useMemo(() => {
                const base = new Set();
                productos.forEach((producto) => {
                        if (producto.categoria) {
                                base.add(producto.categoria);
                        }
                });
                return Array.from(base).sort();
        }, [productos]);

        const resumen = useMemo(() => {
                const total = productos.length;
                const disponibles = productos.filter((producto) => producto.disponible).length;
                return {
                        total,
                        disponibles,
                        noDisponibles: total - disponibles,
                };
        }, [productos]);

        const productosFiltrados = productos.filter((producto) => {
                const coincideBusqueda =
                        searchTerm.trim() === "" ||
                        producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());

                const coincideCategoria =
                        filterCategoria === "todas" || producto.categoria === filterCategoria;

                const coincideDisponibilidad =
                        filterDisponibilidad === "todas" ||
                        (filterDisponibilidad === "disponibles" && producto.disponible) ||
                        (filterDisponibilidad === "no-disponibles" && !producto.disponible);

                return coincideBusqueda && coincideCategoria && coincideDisponibilidad;
        });

        const renderEstado = (valor) => (
                <Badge className={`${estadoBadge[valor]} text-white`}>
                        {estadoLabel[valor]}
                </Badge>
        );

        if (loading) {
                return (
                        <div className="flex h-screen items-center justify-center">
                                <p>Cargando productos...</p>
                        </div>
                );
        }

        return (
                <div className="container mx-auto px-4 py-6 space-y-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                                                <Package className="h-6 w-6" /> Catálogo de productos
                                        </h2>
                                        <p className="text-muted-foreground">
                                                Administra el catálogo disponible para agregar productos a las reservas.
                                        </p>
                                </div>
                                <div className="flex items-center gap-2">
                                        <Button variant="outline" onClick={fetchProductos}>
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Actualizar
                                        </Button>
                                        <Button onClick={() => handleOpenDialog()}>
                                                <Plus className="mr-2 h-4 w-4" /> Nuevo producto
                                        </Button>
                                </div>
                        </div>

                        {error && (
                                <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
                                        <AlertCircle className="h-5 w-5 text-destructive" />
                                        <span className="text-destructive">{error}</span>
                                </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Productos totales</CardTitle>
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                                <div className="text-2xl font-bold">{resumen.total}</div>
                                                <p className="text-xs text-muted-foreground">
                                                        Incluye todos los productos registrados.
                                                </p>
                                        </CardContent>
                                </Card>
                                <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
                                                <Sparkles className="h-4 w-4 text-green-500" />
                                        </CardHeader>
                                        <CardContent>
                                                <div className="text-2xl font-bold">{resumen.disponibles}</div>
                                                <p className="text-xs text-muted-foreground">
                                                        Productos habilitados para nuevas reservas.
                                                </p>
                                        </CardContent>
                                </Card>
                                <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">No disponibles</CardTitle>
                                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                        </CardHeader>
                                        <CardContent>
                                                <div className="text-2xl font-bold">{resumen.noDisponibles}</div>
                                                <p className="text-xs text-muted-foreground">
                                                        Mantén control sobre artículos agotados o pausados.
                                                </p>
                                        </CardContent>
                                </Card>
                        </div>

                        <Card>
                                <CardContent className="space-y-4 pt-6">
                                        <div className="grid gap-4 md:grid-cols-3">
                                                <div className="md:col-span-1">
                                                        <Label htmlFor="search">Buscar</Label>
                                                        <div className="relative mt-1">
                                                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                                <Input
                                                                        id="search"
                                                                        placeholder="Buscar por nombre o descripción"
                                                                        value={searchTerm}
                                                                        onChange={(event) => setSearchTerm(event.target.value)}
                                                                        className="pl-9"
                                                                />
                                                        </div>
                                                </div>
                                                <div>
                                                        <Label>Categoría</Label>
                                                        <Select
                                                                value={filterCategoria}
                                                                onValueChange={setFilterCategoria}
                                                        >
                                                                <SelectTrigger className="mt-1">
                                                                        <SelectValue placeholder="Todas las categorías" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                        <SelectItem value="todas">Todas</SelectItem>
                                                                        {categorias.map((categoria) => (
                                                                                <SelectItem key={categoria} value={categoria}>
                                                                                        {categoria}
                                                                                </SelectItem>
                                                                        ))}
                                                                </SelectContent>
                                                        </Select>
                                                </div>
                                                <div>
                                                        <Label>Disponibilidad</Label>
                                                        <Select
                                                                value={filterDisponibilidad}
                                                                onValueChange={setFilterDisponibilidad}
                                                        >
                                                                <SelectTrigger className="mt-1">
                                                                        <SelectValue placeholder="Todas" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                        <SelectItem value="todas">Todas</SelectItem>
                                                                        <SelectItem value="disponibles">Disponibles</SelectItem>
                                                                        <SelectItem value="no-disponibles">No disponibles</SelectItem>
                                                                </SelectContent>
                                                        </Select>
                                                </div>
                                        </div>

                                        <div className="overflow-x-auto rounded-md border">
                                                <Table>
                                                        <TableHeader>
                                                                <TableRow>
                                                                        <TableHead>Nombre</TableHead>
                                                                        <TableHead>Categoría</TableHead>
                                                                        <TableHead>Precio</TableHead>
                                                                        <TableHead>Disponibilidad</TableHead>
                                                                        <TableHead>Stock</TableHead>
                                                                        <TableHead>Orden</TableHead>
                                                                        <TableHead className="text-right">Acciones</TableHead>
                                                                </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                                {productosFiltrados.length === 0 ? (
                                                                        <TableRow>
                                                                                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                                                                                        No hay productos que coincidan con los filtros seleccionados.
                                                                                </TableCell>
                                                                        </TableRow>
                                                                ) : (
                                                                        productosFiltrados.map((producto) => (
                                                                                <TableRow key={producto.id}>
                                                                                        <TableCell>
                                                                                                <div className="font-medium">{producto.nombre}</div>
                                                                                                {producto.descripcion && (
                                                                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                                                                                {producto.descripcion}
                                                                                                        </p>
                                                                                                )}
                                                                                        </TableCell>
                                                                                        <TableCell>
                                                                                                <Badge variant="outline">{producto.categoria || "General"}</Badge>
                                                                                        </TableCell>
                                                                                        <TableCell>{formatCurrency(Number(producto.precio || 0))}</TableCell>
                                                                                        <TableCell>
                                                                                                <div className="flex items-center gap-2">
                                                                                                        <Switch
                                                                                                                checked={!!producto.disponible}
                                                                                                                onCheckedChange={() =>
                                                                                                                        handleToggleDisponible(producto)
                                                                                                                }
                                                                                                                disabled={toggling[producto.id]}
                                                                                                        />
                                                                                                        {renderEstado(!!producto.disponible)}
                                                                                                </div>
                                                                                        </TableCell>
                                                                                        <TableCell>
                                                                                                {producto.stock === null || producto.stock === undefined
                                                                                                        ? "—"
                                                                                                        : producto.stock}
                                                                                        </TableCell>
                                                                                        <TableCell>
                                                                                                {producto.orden === null || producto.orden === undefined
                                                                                                        ? "—"
                                                                                                        : producto.orden}
                                                                                        </TableCell>
                                                                                        <TableCell className="text-right">
                                                                                                <div className="flex items-center justify-end gap-2">
                                                                                                        <Button
                                                                                                                variant="outline"
                                                                                                                size="sm"
                                                                                                                onClick={() => handleOpenDialog(producto)}
                                                                                                        >
                                                                                                                <Edit className="mr-1 h-4 w-4" /> Editar
                                                                                                        </Button>
                                                                                                        <Button
                                                                                                                variant="destructive"
                                                                                                                size="sm"
                                                                                                                onClick={() => {
                                                                                                                        setSelectedProducto(producto);
                                                                                                                        setShowDeleteDialog(true);
                                                                                                                }}
                                                                                                        >
                                                                                                                <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                                                                                                        </Button>
                                                                                                </div>
                                                                                        </TableCell>
                                                                                </TableRow>
                                                                        ))
                                                                )}
                                                        </TableBody>
                                                </Table>
                                        </div>
                                </CardContent>
                        </Card>

                        <Dialog open={showDialog} onOpenChange={setShowDialog}>
                                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                                <DialogTitle>
                                                        {selectedProducto ? "Editar producto" : "Nuevo producto"}
                                                </DialogTitle>
                                                <DialogDescription>
                                                        Define los datos del producto. Todos los campos pueden actualizarse en cualquier momento.
                                                </DialogDescription>
                                        </DialogHeader>
                                        <form className="space-y-4" onSubmit={handleSubmit}>
                                                <div className="grid gap-4 md:grid-cols-2">
                                                        <div className="space-y-2">
                                                                <Label htmlFor="nombre">Nombre</Label>
                                                                <Input
                                                                        id="nombre"
                                                                        value={formData.nombre}
                                                                        onChange={(event) => handleInputChange("nombre", event.target.value)}
                                                                        required
                                                                />
                                                        </div>
                                                        <div className="space-y-2">
                                                                <Label htmlFor="categoria">Categoría</Label>
                                                                <Input
                                                                        id="categoria"
                                                                        value={formData.categoria}
                                                                        onChange={(event) => handleInputChange("categoria", event.target.value)}
                                                                />
                                                        </div>
                                                        <div className="space-y-2">
                                                                <Label htmlFor="precio">Precio (CLP)</Label>
                                                                <Input
                                                                        id="precio"
                                                                        type="number"
                                                                        min="0"
                                                                        step="100"
                                                                        value={formData.precio}
                                                                        onChange={(event) => handleInputChange("precio", event.target.value)}
                                                                />
                                                        </div>
                                                        <div className="space-y-2">
                                                                <Label htmlFor="stock">Stock</Label>
                                                                <Input
                                                                        id="stock"
                                                                        type="number"
                                                                        min="0"
                                                                        value={formData.stock}
                                                                        onChange={(event) => handleInputChange("stock", event.target.value)}
                                                                        placeholder="Dejar en blanco si no aplica"
                                                                />
                                                        </div>
                                                        <div className="space-y-2">
                                                                <Label htmlFor="orden">Orden</Label>
                                                                <Input
                                                                        id="orden"
                                                                        type="number"
                                                                        value={formData.orden}
                                                                        onChange={(event) => handleInputChange("orden", event.target.value)}
                                                                        placeholder="Prioridad en el catálogo"
                                                                />
                                                        </div>
                                                        <div className="space-y-2">
                                                                <Label htmlFor="imagenUrl">URL de imagen</Label>
                                                                <Input
                                                                        id="imagenUrl"
                                                                        value={formData.imagenUrl}
                                                                        onChange={(event) => handleInputChange("imagenUrl", event.target.value)}
                                                                        placeholder="https://..."
                                                                />
                                                        </div>
                                                </div>
                                                <div className="space-y-2">
                                                        <Label htmlFor="descripcion">Descripción</Label>
                                                        <Textarea
                                                                id="descripcion"
                                                                value={formData.descripcion}
                                                                onChange={(event) => handleInputChange("descripcion", event.target.value)}
                                                                rows={3}
                                                        />
                                                </div>
                                                <div className="grid gap-4 md:grid-cols-2">
                                                        <div className="space-y-2">
                                                                <Label htmlFor="disponibleEnRuta">Disponible en rutas</Label>
                                                                <Textarea
                                                                        id="disponibleEnRuta"
                                                                        value={formData.disponibleEnRuta}
                                                                        onChange={(event) =>
                                                                                handleInputChange(
                                                                                        "disponibleEnRuta",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                        rows={3}
                                                                        placeholder="Ejemplo: Santiago, Temuco"
                                                                />
                                                                <p className="text-xs text-muted-foreground">
                                                                        Separa los destinos con comas. Deja vacío para habilitar en todas las rutas.
                                                                </p>
                                                        </div>
                                                        <div className="space-y-2">
                                                                <Label htmlFor="disponibleEnVehiculo">Disponible en tipos de vehículo</Label>
                                                                <Textarea
                                                                        id="disponibleEnVehiculo"
                                                                        value={formData.disponibleEnVehiculo}
                                                                        onChange={(event) =>
                                                                                handleInputChange(
                                                                                        "disponibleEnVehiculo",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                        rows={3}
                                                                        placeholder="Ejemplo: sedan, van, minibus"
                                                                />
                                                                <p className="text-xs text-muted-foreground">
                                                                        Separa los tipos con comas. Deja vacío para habilitar en todos los vehículos.
                                                                </p>
                                                        </div>
                                                </div>
                                                <div className="flex items-center justify-between rounded-md border px-4 py-3">
                                                        <div>
                                                                <p className="text-sm font-medium">Producto disponible</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                        Puedes activarlo o pausarlo en cualquier momento.
                                                                </p>
                                                        </div>
                                                        <Switch
                                                                checked={formData.disponible}
                                                                onCheckedChange={(value) => handleInputChange("disponible", value)}
                                                        />
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                        <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={saving}>
                                                                Cancelar
                                                        </Button>
                                                        <Button type="submit" disabled={saving}>
                                                                {saving ? "Guardando..." : "Guardar"}
                                                        </Button>
                                                </div>
                                        </form>
                                </DialogContent>
                        </Dialog>

                        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                                <AlertDialogContent>
                                        <AlertDialogHeader>
                                                <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                        Esta acción eliminará el producto del catálogo. No podrás eliminarlo si está asociado a reservas.
                                                </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                                <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                        onClick={handleDelete}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        disabled={deleting}
                                                >
                                                        {deleting ? "Eliminando..." : "Eliminar"}
                                                </AlertDialogAction>
                                        </AlertDialogFooter>
                                </AlertDialogContent>
                        </AlertDialog>
                </div>
        );
}

export default AdminProductos;
