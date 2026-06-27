# AGENTS.md — Sistema de Gestión para Taller de Reparación de Computadoras

> Este documento es la **fuente de verdad** del proyecto. Cualquier agente de IA
> (OpenCode/DeepSeek, Claude Code) debe leerlo **completo** antes de generar o
> modificar código. No inventes entidades, campos ni dependencias que no estén
> descritas aquí. Si algo no está definido, elige la opción más simple y déjalo
> anotado en el CHANGELOG, no lo improvises en silencio.

---

## 1. Propósito

Aplicación web para administrar un taller de reparación de computadoras. Cubre el
flujo central:

1. Registrar el **ingreso** de equipos (nota de recepción).
2. Guardar **información básica del cliente**.
3. Gestionar **diagnósticos**.
4. Controlar **tiempos de entrega** (fecha prometida vs. fecha real) y registrar la
   **nota de entrega**.

Es una herramienta **interna del taller**, no un sistema de facturación.

---

## 2. Modelo de despliegue (MUY IMPORTANTE)

- **Single-tenant: un despliegue por taller.** Cada taller corre su propia copia con
  su propia base de datos. **No hay multi-tenancy.** No agregues `tenant_id` ni lógica
  de aislamiento entre talleres.
- El código se publica en GitHub y cada colega lo clona y despliega en su propio VPS
  (con EasyPanel) o lo corre en local para desarrollo.
- **Toda configuración específica del taller** (nombre, moneda, datos de contacto,
  usuario admin inicial) vive en variables de entorno o en la tabla de Ajustes.
  **Nunca** debe quedar nada de un taller concreto escrito en el código.
- Entornos objetivo:
  - **Local (Windows):** solo para desarrollo, vía Docker. No se requiere modo offline.
  - **Producción:** VPS con EasyPanel usando el mismo `Dockerfile`.

---

## 3. Stack tecnológico

- **Next.js (App Router) + TypeScript** — una sola base de código (frontend + backend).
- **PostgreSQL** como base de datos.
- **Prisma** como ORM. El esquema de Prisma es la fuente de verdad del modelo de datos.
- **Prisma Migrate** para migraciones. **Prohibido** alterar la base de datos a mano.
- **Autenticación** propia simple basada en sesión (email + contraseña con hash). No
  agregues OAuth ni proveedores externos.
- **Docker** + `docker-compose` para paridad local/producción.
- **Idioma de la interfaz: español.**

> Regla: no agregar librerías "porque sí". Cada dependencia nueva debe justificarse.
> Mantener el stack pequeño y mainstream.

---

## 4. Modelo de datos

El esquema completo y actualizado vive en `prisma/schema.prisma` — esa es la fuente de verdad.
Las entidades actuales son: **Usuario, Cliente, Orden, Diagnostico, Ajustes, HistorialEstado, Pago**.

Esquema de referencia en Prisma (ajustable en detalles, no en su esencia):

El esquema de referencia completo está en `prisma/schema.prisma`. Resumen de entidades y campos clave:

- **`Rol`** enum: `ADMIN | TECNICO`
- **`EstadoOrden`** enum: `RECIBIDO | EN_DIAGNOSTICO | PRESUPUESTADO | APROBADO | EN_REPARACION | LISTO | ENTREGADO | NO_APROBADO | CANCELADO`
- **`EstadoPago`** enum (v1.1): `PENDIENTE | ABONADO | PAGADO`
- **`Usuario`**: id, nombre, email, passwordHash, rol, activo, createdAt. Relaciones: ordenesRecibidas, ordenesEntregadas, diagnosticos, historial, pagos.
- **`Cliente`**: id, nombre, telefono?, email?, documento?, notas?, timestamps. Relación: ordenes.
- **`Orden`**: folio (autoincr.), clienteId, datos del equipo (tipoEquipo, marca, modelo, serie, accesorios), recepción (fallaReportada, estadoFisico, notasRecepcion, contrasenaEquipo?), tiempos (fechaIngreso, fechaPrometida?, fechaEntrega?), flujo (estado, estadoPago, costo?), entrega (trabajoRealizado?, notasEntrega?), recibidoPorId, entregadoPorId?, timestamps. Relaciones: diagnosticos, historial, pagos.
- **`Diagnostico`**: hallazgos, solucionPropuesta?, costoEstimado?, aprobado (null=pendiente), tecnicoId, ordenId.
- **`HistorialEstado`** (v1.1): ordenId, estadoAnterior?, estadoNuevo, usuarioId, createdAt. Registro inmutable de cada transición de estado.
- **`Pago`** (v1.1): ordenId, monto, metodo?, nota?, usuarioId, createdAt. Registro inmutable de cada cobro.
- **`Ajustes`**: singleton (id=1). nombreTaller, moneda (ISO 4217), telefono?, direccion?, logoUrl?.

### Notas del modelo
- **La moneda es global del taller**, vive en `Ajustes.moneda`. No se elige por orden.
  Todos los montos se muestran formateados con esa moneda (usar `Intl.NumberFormat`).
- **No hay RFC ni datos fiscales.** El cliente es solo información básica de contacto.
- `folio` es el número legible que se le da al cliente en la nota de recepción.
- `HistorialEstado` y `Pago` son registros inmutables (no hay update ni delete). La bitácora arranca desde que se implementó v1.1; las órdenes anteriores no tienen historial retroactivo.
- `estadoPago` se recalcula automáticamente al registrar un pago o al actualizar el costo de la orden. Regla: sin pagos o costo nulo → `PENDIENTE`; pagos < costo → `ABONADO`; pagos ≥ costo → `PAGADO`.

---

## 5. Máquina de estados de la Orden

Flujo normal:

```
RECIBIDO → EN_DIAGNOSTICO → PRESUPUESTADO → APROBADO → EN_REPARACION → LISTO → ENTREGADO
```

Ramas alternas:
- Desde `PRESUPUESTADO` el cliente puede rechazar → `NO_APROBADO` → (se entrega sin reparar) → `ENTREGADO`.
- Desde casi cualquier estado previo a la entrega se puede `CANCELADO`.

Reglas:
- Al pasar a `ENTREGADO` se debe registrar `fechaEntrega` y `entregadoPorId`.
- El control de tiempos compara `fechaPrometida` con la fecha actual (si no está
  entregada) o con `fechaEntrega`. Una orden está **atrasada** si hoy > `fechaPrometida`
  y el estado no es `ENTREGADO`/`CANCELADO`/`NO_APROBADO`.

---

## 6. Roles y permisos (simple)

- **ADMIN:** todo, incluyendo gestionar usuarios y editar Ajustes.
- **TECNICO:** registrar ingresos, crear/editar diagnósticos, mover estados, registrar
  entregas. No edita Ajustes ni gestiona usuarios.

No hace falta un sistema de permisos granular. Basta con estos dos roles.

---

## 7. Alcance implementado

### v1.0 — Implementada y estable

- CRUD de clientes (datos básicos).
- Registro de ingreso de equipos (orden + nota de recepción).
- Diagnósticos asociados a la orden.
- Máquina de estados + control de tiempos (alertas de atraso en el listado).
- Nota de entrega.
- Comprobante de ingreso (página de impresión/PDF).
- Configuración del taller (Ajustes) y gestión de usuarios.
- Dashboard con conteos por estado y órdenes atrasadas.

### v1.1 — Parcialmente implementada (ver `V1.1.md` para el detalle completo)

**Implementado:**
- Sección 1: **Bitácora de estados** — `HistorialEstado`, timeline en el detalle de la orden.
- Sección 2: **Pagos y abonos** — `Pago`, `EstadoPago`, formulario de abono, resumen costo/abonado/saldo, badge y filtro en el listado.

**Pendiente (no implementar sin instrucción explícita):**
- Sección 3: Aviso por WhatsApp.
- Sección 4: Etiqueta imprimible.
- Sección 5: Reportes básicos.

### Fuera de alcance (no implementar)

- Inventario de refacciones.
- Facturación / documentos fiscales.
- Fotos del equipo / manejo de archivos subidos.
- Portal de cara al cliente.
- Multi-tenancy.

> Si una funcionalidad fuera de alcance "ayudaría", **no la agregues**. Anótala como
> idea futura en el CHANGELOG.

---

## 8. Convenciones de despliegue y arranque

- **Turnkey:** el primer arranque debe dejar el sistema usable sin pasos manuales en
  consola. Al iniciar, el contenedor debe:
  1. Ejecutar las migraciones pendientes (`prisma migrate deploy`).
  2. Ejecutar un **seed idempotente** que crea (si no existe) el usuario ADMIN con datos
     del `.env` y la fila singleton de `Ajustes`.
- **`.env.example`** documentado con todas las variables. Variables mínimas:
  - `DATABASE_URL`
  - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NOMBRE`
  - `TALLER_NOMBRE`, `TALLER_MONEDA`
  - `SESSION_SECRET`
- **Docker:** `Dockerfile` para la app + `docker-compose.yml` con `app` + `postgres`
  para correr en local en Windows con `docker compose up`.
- **EasyPanel:** usa el mismo `Dockerfile`; el Postgres puede ser el servicio
  administrado de EasyPanel. Solo se configuran variables de entorno.
- **Actualizaciones:** un colega actualiza con `git pull` + reconstruir; las migraciones
  corren solas. Documentar en el README. Avisar en el CHANGELOG cuando una versión traiga
  cambios de base de datos.
- **Respaldos:** responsabilidad de cada taller. Documentar en el README cómo respaldar
  el Postgres (incluyendo la opción de backups de EasyPanel).

---

## 9. Convenciones de código

- TypeScript estricto. Nada de `any` salvo casos justificados.
- El esquema de Prisma manda: si cambia el modelo, se crea una migración.
- Validación de entradas en el servidor (con `zod`).
- Construir por **rebanadas verticales**: una funcionalidad completa de punta a punta
  (formulario → guardado → listado → detalle) antes de pasar a la siguiente.
- Estructura de carpetas (App Router):
  ```
  /app              rutas y páginas
  /app/api          endpoints REST si se necesitan
  /lib              módulos de servidor y utilidades
  /components       componentes de UI reutilizables
  /prisma           schema.prisma, migraciones, seed.ts
  ```
- **Separación cliente / servidor en `lib/`:**
  - `lib/utils.ts` — helpers **puros**, sin imports de Node.js ni Prisma. Seguro para
    importar desde componentes cliente. Contiene: `ESTADO_LABELS`, `TRANSICIONES`,
    `ESTADO_PAGO_LABELS`, `calcularEstadoPago`, `esEstadoTerminal`, `ordenEstaAtrasada`,
    `localeDesdeMoneda`.
  - `lib/format.ts` — funciones de formato y acceso a BD. Empieza con
    `import "server-only"`. Contiene: `getMoneda`, `formatDate`, `formatDateShort`,
    `formatCurrency`. Si un componente cliente intenta importar este módulo, el build
    falla de inmediato con mensaje claro.
  - `lib/actions/` — Server Actions (`"use server"`). Cada archivo agrupa las acciones
    de una entidad (`ordenes.ts`, `clientes.ts`, `pagos.ts`, etc.).
  - No mezclar: **nunca** importes `prisma` desde un archivo que pueda ser incluido en
    el bundle del navegador.
- Textos de interfaz en español.
- Las migraciones en desarrollo local se aplican con `npm run db:migrate` después de
  hacer `git pull`. En Docker y EasyPanel ocurre automáticamente al arrancar.

---

## 10. Licencia

Decidir antes de publicar: MIT si se quiere abierto, o privado por invitación si se quiere
controlar el acceso. (Pendiente de definir por el dueño del repo.)
