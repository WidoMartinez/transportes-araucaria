import { useMemo, useState } from "react";
import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "Araucaria2025";

function AdminPanel({
        destinos,
        setDestinos,
        descuentoOnline,
        setDescuentoOnline,
        onResetTarifas,
}) {
        const [open, setOpen] = useState(false);
        const [isAuthenticated, setIsAuthenticated] = useState(false);
        const [password, setPassword] = useState("");
        const [errorMessage, setErrorMessage] = useState("");

        const sortedDestinos = useMemo(
                () => [...destinos].sort((a, b) => a.nombre.localeCompare(b.nombre)),
                [destinos]
        );

        const formatPercentageValue = (value) => {
                const numeric = Number.isFinite(value) ? value : 0;
                return Math.round(numeric * 10000) / 100;
        };

        const handleOpenChange = (value) => {
                setOpen(value);
                if (!value) {
                        setTimeout(() => {
                                setIsAuthenticated(false);
                                setPassword("");
                                setErrorMessage("");
                        }, 200);
                }
        };

        const handlePasswordSubmit = (event) => {
                event.preventDefault();
                if (password === ADMIN_PASSWORD) {
                        setIsAuthenticated(true);
                        setPassword("");
                        setErrorMessage("");
                } else {
                        setErrorMessage("Contraseña incorrecta. Inténtalo nuevamente.");
                }
        };

        const updatePrecio = (destinoNombre, vehiculo, updater) => {
                setDestinos((prevDestinos) =>
                        prevDestinos.map((destino) => {
                                if (destino.nombre !== destinoNombre) {
                                        return destino;
                                }

                                const precios = destino.precios || {};
                                const vehiculoActual = precios[vehiculo] || {};

                                return {
                                        ...destino,
                                        precios: {
                                                ...precios,
                                                [vehiculo]: updater(vehiculoActual),
                                        },
                                };
                        })
                );
        };

        const handleBaseChange = (destinoNombre, vehiculo, rawValue) => {
                let numericValue = Number.parseFloat(rawValue);
                if (Number.isNaN(numericValue)) {
                        numericValue = 0;
                }
                const valor = Math.max(0, Math.round(numericValue));

                updatePrecio(destinoNombre, vehiculo, (vehiculoActual) => ({
                        ...vehiculoActual,
                        base: valor,
                }));
        };

        const handlePercentChange = (destinoNombre, vehiculo, rawValue) => {
                let numericValue = Number.parseFloat(rawValue);
                if (Number.isNaN(numericValue)) {
                        numericValue = 0;
                }
                const porcentaje = Math.max(0, Math.min(numericValue, 100)) / 100;
                const porcentajeRedondeado = Math.round(porcentaje * 1000) / 1000;

                updatePrecio(destinoNombre, vehiculo, (vehiculoActual) => ({
                        ...vehiculoActual,
                        porcentajeAdicional: porcentajeRedondeado,
                }));
        };

        const handleDiscountChange = (rawValue) => {
                let numericValue = Number.parseFloat(rawValue);
                if (Number.isNaN(numericValue)) {
                        numericValue = 0;
                }
                const porcentaje = Math.max(0, Math.min(numericValue, 100)) / 100;
                const porcentajeRedondeado = Math.round(porcentaje * 1000) / 1000;
                setDescuentoOnline(porcentajeRedondeado);
        };

        const handleResetClick = () => {
                if (
                        typeof window !== "undefined" &&
                        window.confirm(
                                "¿Restablecer todas las tarifas y el descuento a los valores originales?"
                        )
                ) {
                        onResetTarifas();
                }
        };

        return (
                <Dialog open={open} onOpenChange={handleOpenChange}>
                        <DialogTrigger asChild>
                                <Button
                                        variant="secondary"
                                        size="sm"
                                        className="fixed bottom-4 right-4 z-50 shadow-lg"
                                >
                                        Administrar tarifas
                                </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-3xl">
                                <DialogHeader>
                                        <DialogTitle>Panel de tarifas</DialogTitle>
                                        <DialogDescription>
                                                Actualiza manualmente los precios de cada tramo. Los cambios se guardan
                                                automáticamente en este navegador.
                                        </DialogDescription>
                                </DialogHeader>
                                {isAuthenticated ? (
                                        <>
                                                <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
                                                        <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
                                                                <h3 className="text-sm font-semibold uppercase text-primary">
                                                                        Descuento en pagos online
                                                                </h3>
                                                                <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,240px)_1fr] sm:items-end">
                                                                        <div className="space-y-2">
                                                                                <Label htmlFor="admin-descuento">
                                                                                        Porcentaje de descuento (%)
                                                                                </Label>
                                                                                <Input
                                                                                        id="admin-descuento"
                                                                                        type="number"
                                                                                        min="0"
                                                                                        max="100"
                                                                                        step="0.5"
                                                                                        value={formatPercentageValue(descuentoOnline)}
                                                                                        onChange={(event) =>
                                                                                                handleDiscountChange(event.target.value)
                                                                                        }
                                                                                />
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground">
                                                                                Se aplica automáticamente al precio calculado para el cliente.
                                                                        </p>
                                                                </div>
                                                        </div>
                                                        {sortedDestinos.map((destino) => (
                                                                <div
                                                                        key={destino.nombre}
                                                                        className="space-y-4 rounded-lg border border-border bg-background/60 p-4 shadow-sm"
                                                                >
                                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                                                <div>
                                                                                        <h3 className="text-lg font-semibold">
                                                                                                {destino.nombre}
                                                                                        </h3>
                                                                                        <p className="max-w-xl text-xs text-muted-foreground">
                                                                                                {destino.descripcion}
                                                                                        </p>
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground">
                                                                                        {destino.tiempo} · Máx. {destino.maxPasajeros} pasajeros
                                                                                </div>
                                                                        </div>
                                                                        <div className="grid gap-4 md:grid-cols-2">
                                                                                {destino.precios.auto && (
                                                                                        <div className="space-y-3 rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 p-3">
                                                                                                <p className="text-sm font-semibold uppercase text-muted-foreground">
                                                                                                        Auto privado
                                                                                                </p>
                                                                                                <div className="grid gap-3">
                                                                                                        <div className="space-y-2">
                                                                                                                <Label htmlFor={`auto-base-${destino.nombre}`}>
                                                                                                                        Tarifa base (CLP)
                                                                                                                </Label>
                                                                                                                <Input
                                                                                                                        id={`auto-base-${destino.nombre}`}
                                                                                                                        type="number"
                                                                                                                        min="0"
                                                                                                                        step="500"
                                                                                                                        value={destino.precios.auto.base ?? 0}
                                                                                                                        onChange={(event) =>
                                                                                                                                handleBaseChange(
                                                                                                                                        destino.nombre,
                                                                                                                                        "auto",
                                                                                                                                        event.target.value
                                                                                                                                )
                                                                                                                        }
                                                                                                                />
                                                                                                        </div>
                                                                                                        <div className="space-y-2">
                                                                                                                <Label htmlFor={`auto-porcentaje-${destino.nombre}`}>
                                                                                                                        Recargo por pasajero adicional (%)
                                                                                                                </Label>
                                                                                                                <Input
                                                                                                                        id={`auto-porcentaje-${destino.nombre}`}
                                                                                                                        type="number"
                                                                                                                        min="0"
                                                                                                                        max="100"
                                                                                                                        step="0.5"
                                                                                                                        value={formatPercentageValue(
                                                                                                                                destino.precios.auto.porcentajeAdicional
                                                                                                                        )}
                                                                                                                        onChange={(event) =>
                                                                                                                                handlePercentChange(
                                                                                                                                        destino.nombre,
                                                                                                                                        "auto",
                                                                                                                                        event.target.value
                                                                                                                                )
                                                                                                                        }
                                                                                                                />
                                                                                                        </div>
                                                                                                </div>
                                                                                        </div>
                                                                                )}
                                                                                {destino.precios.van && (
                                                                                        <div className="space-y-3 rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 p-3">
                                                                                                <p className="text-sm font-semibold uppercase text-muted-foreground">
                                                                                                        Van de pasajeros
                                                                                                </p>
                                                                                                <div className="grid gap-3">
                                                                                                        <div className="space-y-2">
                                                                                                                <Label htmlFor={`van-base-${destino.nombre}`}>
                                                                                                                        Tarifa base (CLP)
                                                                                                                </Label>
                                                                                                                <Input
                                                                                                                        id={`van-base-${destino.nombre}`}
                                                                                                                        type="number"
                                                                                                                        min="0"
                                                                                                                        step="1000"
                                                                                                                        value={destino.precios.van.base ?? 0}
                                                                                                                        onChange={(event) =>
                                                                                                                                handleBaseChange(
                                                                                                                                        destino.nombre,
                                                                                                                                        "van",
                                                                                                                                        event.target.value
                                                                                                                                )
                                                                                                                        }
                                                                                                                />
                                                                                                        </div>
                                                                                                        <div className="space-y-2">
                                                                                                                <Label htmlFor={`van-porcentaje-${destino.nombre}`}>
                                                                                                                        Recargo por pasajero adicional (%)
                                                                                                                </Label>
                                                                                                                <Input
                                                                                                                        id={`van-porcentaje-${destino.nombre}`}
                                                                                                                        type="number"
                                                                                                                        min="0"
                                                                                                                        max="100"
                                                                                                                        step="0.5"
                                                                                                                        value={formatPercentageValue(
                                                                                                                                destino.precios.van.porcentajeAdicional
                                                                                                                        )}
                                                                                                                        onChange={(event) =>
                                                                                                                                handlePercentChange(
                                                                                                                                        destino.nombre,
                                                                                                                                        "van",
                                                                                                                                        event.target.value
                                                                                                                                )
                                                                                                                        }
                                                                                                                />
                                                                                                        </div>
                                                                                                </div>
                                                                                        </div>
                                                                                )}
                                                                        </div>
                                                                </div>
                                                        ))}
                                                </div>
                                                <DialogFooter className="pt-2">
                                                        <Button
                                                                type="button"
                                                                variant="destructive"
                                                                onClick={handleResetClick}
                                                                className="w-full sm:w-auto"
                                                        >
                                                                Restablecer valores iniciales
                                                        </Button>
                                                </DialogFooter>
                                        </>
                                ) : (
                                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                                <div className="space-y-2">
                                                        <Label htmlFor="admin-password">Contraseña de administrador</Label>
                                                        <Input
                                                                id="admin-password"
                                                                type="password"
                                                                autoComplete="current-password"
                                                                value={password}
                                                                onChange={(event) => setPassword(event.target.value)}
                                                                placeholder="Ingresa la contraseña"
                                                                required
                                                        />
                                                </div>
                                                {errorMessage && (
                                                        <p className="text-sm text-destructive">{errorMessage}</p>
                                                )}
                                                <DialogFooter>
                                                        <Button type="submit" className="w-full sm:w-auto">
                                                                Ingresar
                                                        </Button>
                                                </DialogFooter>
                                        </form>
                                )}
                        </DialogContent>
                </Dialog>
        );
}

export default AdminPanel;
