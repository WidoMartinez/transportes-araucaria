const DEFAULT_DECIMALS = 0;

export const calcularCotizacion = (destino, pasajeros) => {
        if (!destino || !pasajeros || destino.nombre === "Otro") {
                return { precio: null, vehiculo: null };
        }

        const numPasajeros = parseInt(pasajeros, 10);
        let vehiculoAsignado;
        let precioFinal;

        if (Number.isNaN(numPasajeros) || numPasajeros <= 0) {
                return { precio: null, vehiculo: null };
        }

        if (numPasajeros <= 4) {
                vehiculoAsignado = "Auto Privado";
                const precios = destino.precios.auto;
                if (!precios) return { precio: null, vehiculo: vehiculoAsignado };

                const pasajerosAdicionales = Math.max(numPasajeros - 1, 0);
                const costoAdicional = precios.base * precios.porcentajeAdicional;
                precioFinal = precios.base + pasajerosAdicionales * costoAdicional;
        } else if (numPasajeros <= 7) {
                vehiculoAsignado = "Van de Pasajeros";
                const precios = destino.precios.van;
                if (!precios) return { precio: null, vehiculo: vehiculoAsignado };

                const pasajerosAdicionales = Math.max(numPasajeros - 5, 0);
                const costoAdicional = precios.base * precios.porcentajeAdicional;
                precioFinal = precios.base + pasajerosAdicionales * costoAdicional;
        } else {
                vehiculoAsignado = "Consultar disponibilidad";
                precioFinal = null;
        }

        return { precio: precioFinal ? Math.round(precioFinal) : null, vehiculo: vehiculoAsignado };
};

const roundCurrency = (value) => {
        if (!value) return 0;
        return Number(Number(value).toFixed(DEFAULT_DECIMALS));
};

export const obtenerDesgloseTarifa = ({
        baseFare = 0,
        extrasTotal = 0,
        onlineDiscountRate = 0,
        coupon,
        clubBenefit,
        taxRate = 0,
}) => {
        const subtotal = roundCurrency(baseFare + extrasTotal);

        const onlineDiscountValue = roundCurrency(subtotal * (onlineDiscountRate || 0));

        let couponValue = 0;
        if (coupon?.value) {
                couponValue = coupon.type === "percentage"
                        ? roundCurrency(subtotal * coupon.value)
                        : roundCurrency(coupon.value);
        }

        let clubBenefitValue = 0;
        if (clubBenefit?.discountRate) {
                clubBenefitValue = roundCurrency(subtotal * clubBenefit.discountRate);
        }

        const totalDiscounts = roundCurrency(onlineDiscountValue + couponValue + clubBenefitValue);
        const taxableAmount = Math.max(roundCurrency(subtotal - totalDiscounts), 0);
        const taxes = roundCurrency(taxableAmount * (taxRate || 0));
        const total = roundCurrency(Math.max(taxableAmount + taxes, 0));

        return {
                subtotal,
                baseFare: roundCurrency(baseFare),
                extrasTotal: roundCurrency(extrasTotal),
                onlineDiscountRate: onlineDiscountRate || 0,
                onlineDiscountValue,
                couponValue,
                clubBenefitValue,
                totalDiscounts,
                taxableAmount,
                taxes,
                total,
        };
};

export const calcularAbono = (total, porcentaje) => {
        const amount = roundCurrency(total * porcentaje);
        return {
                amount,
                remainder: roundCurrency(Math.max(total - amount, 0)),
        };
};

export const formatoMonedaCLP = (valor) =>
        new Intl.NumberFormat("es-CL", {
                style: "currency",
                currency: "CLP",
                minimumFractionDigits: DEFAULT_DECIMALS,
        }).format(valor || 0);

