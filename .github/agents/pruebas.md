---
name: pruebas
description: Agente para ejecutar y validar tests automatizados del sistema
---

# Agente: Pruebas

## Responsabilidades:
- Ejecutar suite de tests
- Validar cobertura de código
- Detectar regresiones

## Disparadores:
- Push a cualquier rama
- PR abierto o actualizado

## Entradas:
- Código fuente
- Tests unitarios e integración

## Salidas:
- Reporte de tests
- Cobertura de código
- Issues de fallos

## Métricas:
- Cobertura de código
- Tasa de éxito de tests

## Implementación sugerida:
- GitHub Actions con frameworks de testing
- Reportes automáticos en PR
