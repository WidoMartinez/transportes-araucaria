// migrations/add-abono-flags.js
// Migración para agregar banderas de abono/saldo y clasificación de clientes

import sequelize from "../config/database.js";
import { QueryTypes } from "sequelize";

async function addAbonoFlags() {
        try {
                console.log("🔄 Verificando columnas de abono y clasificación...");

                const reservasColumns = await sequelize.query(
                        "SHOW COLUMNS FROM reservas",
                        { type: QueryTypes.SELECT }
                );
                const reservasColumnNames = reservasColumns.map((col) => col.Field);

                if (!reservasColumnNames.includes("abono_pagado")) {
                        console.log("➕ Agregando columna abono_pagado en reservas...");
                        await sequelize.query(
                                "ALTER TABLE reservas ADD COLUMN abono_pagado TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el abono sugerido fue pagado'"
                        );
                        console.log("✅ Columna abono_pagado agregada");
                }

                if (!reservasColumnNames.includes("saldo_pagado")) {
                        console.log("➕ Agregando columna saldo_pagado en reservas...");
                        await sequelize.query(
                                "ALTER TABLE reservas ADD COLUMN saldo_pagado TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el saldo restante fue pagado por completo'"
                        );
                        console.log("✅ Columna saldo_pagado agregada");
                }

                const clientesColumns = await sequelize.query(
                        "SHOW COLUMNS FROM clientes",
                        { type: QueryTypes.SELECT }
                );
                const clientesColumnNames = clientesColumns.map((col) => col.Field);

                if (!clientesColumnNames.includes("clasificacion")) {
                        console.log("➕ Agregando columna clasificacion en clientes...");
                        await sequelize.query(
                                "ALTER TABLE clientes ADD COLUMN clasificacion VARCHAR(100) NULL COMMENT 'Clasificación asignada al cliente según sus reservas completadas'"
                        );
                        console.log("✅ Columna clasificacion agregada");
                }

                console.log("✅ Migración de abonos y clasificación completada");
                return true;
        } catch (error) {
                console.error("❌ Error en migración de abonos/clasificación:", error);
                throw error;
        }
}

export default addAbonoFlags;
