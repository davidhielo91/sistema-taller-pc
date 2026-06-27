# Changelog

## [1.1.0] — 2026-06-27

### Añadido — Bitácora de estados (v1.1, sección 1)

- **Modelo `HistorialEstado`**: nueva tabla en la base de datos que registra cada cambio de estado de una orden (estado anterior, estado nuevo, usuario y fecha/hora). La migración `20260627000000_add_historial_estado` es aditiva; las órdenes existentes quedan sin historial retroactivo.
- **Transacción atómica en `cambiarEstado`**: la actualización del estado de la orden y la inserción en `HistorialEstado` se realizan ahora dentro de un `prisma.$transaction`, garantizando que nunca queden desincronizados.
- **Línea de tiempo en el detalle de la orden**: sección "Bitácora de cambios" al final de la página, mostrando los cambios del más reciente al más antiguo, con fecha/hora (`formatDate`), transición de estado y nombre del técnico.
- CSS para la línea de tiempo (`.timeline`, `.timeline-item`, etc.) en `app/globals.css`.

### Notas de actualización

- Esta versión incluye un cambio de base de datos. Al actualizar, el contenedor ejecutará la nueva migración automáticamente en el arranque (comportamiento turnkey sin pasos manuales). Se recomienda hacer un respaldo antes de actualizar.

## [1.0.5] — 2026-06-26

### Corregido — Despliegue

- **Bug bloqueante en EasyPanel:** el Dockerfile usaba `CMD ["node", "server.js"]` sin correr migraciones; en EasyPanel el contenedor arrancaba sin tablas y la app crasheaba inmediatamente. Corregido con `ENTRYPOINT` propio.
- **Bug bloqueante en Docker local:** el `entrypoint:` de `docker-compose.yml` llamaba `npx prisma` y `npx tsx` que no existen en el runner standalone (son devDependencies). Ahora el Dockerfile provee el entrypoint y las herramientas necesarias directamente.
- **Cliente generado de Prisma ausente en standalone:** el output standalone de Next.js no garantiza la inclusión de `node_modules/.prisma/client/` (el cliente generado por `prisma generate`); se añadió una copia explícita desde el builder en el Dockerfile.

### Añadido

- `entrypoint.sh`: script de inicio que ejecuta `prisma migrate deploy` → seed → servidor en el arranque del contenedor. Garantiza comportamiento idéntico en local y en producción (EasyPanel).
- En el builder stage del Dockerfile: compilación de `prisma/seed.ts` → `prisma/seed.cjs` con esbuild, eliminando la necesidad de `tsx` en el runner de producción.
- En el runner stage del Dockerfile: copia explícita del CLI de Prisma desde el stage `deps` (binarios Alpine compatibles) para que `prisma migrate deploy` funcione.
- `docker-compose.yml` simplificado: eliminado el `entrypoint:` redundante; ambos entornos usan ahora el mismo `entrypoint.sh` del Dockerfile.

### Mejorado

- `.env.example` reescrito con comentarios detallados, instrucciones para generar `SESSION_SECRET`, y advertencias visibles sobre variables que deben cambiarse antes de producción.
- `README.md` reescrito en español con instrucciones paso a paso para no-desarrolladores: arranque local con Docker en Windows, despliegue completo en EasyPanel (PostgreSQL interno, variables, dominio/SSL), actualización sin pérdida de datos, y respaldos de la base de datos.

### Riesgos señalados (sin implementar — decisión del operador)

- `DATABASE_URL` en EasyPanel: el hostname interno del servicio varía; el usuario debe copiarlo del panel.
- PostgreSQL con SSL requerido: agregar `?sslmode=require` a `DATABASE_URL` si el proveedor lo exige.
- "Start command" en EasyPanel: debe dejarse vacío para no sobreescribir el `ENTRYPOINT` del Dockerfile.
- `prisma migrate deploy` añade ~2–4 s de latencia a cada reinicio del contenedor (comportamiento esperado).

## [1.0.4] — 2026-06-26

### Corregido

- **Bug bloqueante:** crear cliente nuevo desde "Nueva orden" siempre enviaba datos vacíos (el `FormData` apuntaba a un `<div>` oculto con inputs vacíos en vez del `<form>` con los inputs reales); convertido a `<form>` con los nombres correctos
- **Bug bloqueante:** `EditarClientePage` era un Client Component que no cargaba los datos actuales del cliente; convertido a Server Component que pre-rellena todos los campos
- **Rendimiento bloqueante:** `formatDate`, `formatDateShort` y `formatCurrency` en `lib/utils.ts` eran `async` y llamaban a `getMoneda()` (una query SQL) en cada invocación; refactorizadas a síncronas con parámetro `moneda`; cada página ahora obtiene la moneda una sola vez con `getMoneda()` y la pasa a las funciones, eliminando N+1 queries en todos los listados
- **Rendimiento importante:** `getDashboardStats` hacía 9 `COUNT` queries independientes (una por estado); reemplazado por un único `prisma.orden.groupBy`
- **Seguridad importante:** `proxy.ts` no bloqueaba rutas de ADMIN; agregada verificación de rol para `/dashboard/ajustes` y `/dashboard/usuarios`, redirigiendo a técnicos al dashboard
- **UI importante:** link "Dashboard" en la barra lateral estaba siempre activo por usar `pathname.startsWith("/dashboard")`; corregido para usar igualdad exacta en ese caso
- **Accesibilidad:** links activos en `Sidebar` ahora incluyen `aria-current="page"`
- **Feedback:** `AprobarDiagnostico` ahora muestra mensajes de error de la server action en la UI en vez de descartarlos silenciosamente

### Cambiado

- `CambioEstadoSchema` usa `z.nativeEnum(EstadoOrden)` en vez de `z.enum([...])` manual para evitar desincronización con el enum de Prisma
- Eliminado código muerto `if (!session) return null` en `getUser()` de `lib/dal.ts` (nunca se alcanzaba porque `verifySession()` redirige antes de retornar)

## [1.0.3] — 2026-06-26

### Mejorado

- `getMoneda()` ahora consulta la base de datos siempre (sin caché en memoria), reflejando cambios de moneda al instante
- Mapa `MONEDA_LOCALE` para formatear fechas y montos según la moneda configurada (MXN→es-MX, ARS→es-AR, COP→es-CO, USD→en-US, EUR→es-ES, default es-MX)

## [1.0.2] — 2026-06-26

### Seguridad

- `SESSION_SECRET` ahora se valida al arrancar: error claro si está vacía/ausente, y error en producción si aún tiene el valor de relleno
- Cookie de sesión: `secure: true` solo en producción, permitiendo login por HTTP plano en desarrollo local

## [1.0.1] — 2026-06-26

### Corregido

- Comprobante de ingreso: movido a ruta independiente `/comprobante/[id]` fuera del layout del dashboard para evitar HTML anidado inválido (`<html>` dentro de `<html>`)
- Botón de impresión extraído a componente cliente `PrintButton.tsx` para eliminar el `onClick` en línea del Server Component
- Enlace actualizado en el detalle de la orden para abrir el comprobante en nueva pestaña (`target="_blank"`)

## [1.0.0] — 2026-06-26

### Añadido v1 completa

#### Andamiaje inicial (0.1.0)
- Proyecto base Next.js (App Router) + TypeScript + Prisma 7
- Esquema de base de datos con 5 entidades: Usuario, Cliente, Orden, Diagnostico, Ajustes
- Enums: Rol (ADMIN, TECNICO) y EstadoOrden (9 estados)
- Primera migración de base de datos
- Autenticación por sesión (email + contraseña con hash) usando JWT (jose)
- Server Actions: login y logout
- Data Access Layer (DAL) con verifySession y getUser
- Proxy para proteger rutas (Next.js 16 proxy.ts)
- Seed idempotente: crea ADMIN y Ajustes si no existen
- Dockerfile + docker-compose.yml (app + postgres)
- Configuración turnkey: migraciones y seed automáticos al arrancar
- .env.example con todas las variables necesarias
- README con instrucciones para Docker y EasyPanel

#### Clientes (0.2.0)
- CRUD completo: listado con búsqueda por nombre/teléfono, creación, detalle y edición
- API route para búsqueda de clientes

#### Órdenes (0.2.0)
- Formulario de recepción con selección de cliente existente o creación inline
- Listado con filtro por estado, búsqueda y marcado visual de atrasadas
- Vista de detalle con toda la información del equipo, recepción y entrega
- Máquina de estados validada en el servidor
- Formateo de montos con `Intl.NumberFormat` usando moneda configurable

#### Diagnósticos (1.0.0)
- Creación de diagnósticos desde el detalle de la orden
- Aprobación/rechazo de diagnósticos pendientes
- Historial completo de diagnósticos por orden

#### Entrega (1.0.0)
- Acción dedicada "Registrar entrega" cuando la orden está LISTO o NO_APROBADO
- Captura de costo, trabajo realizado y notas de entrega
- Fijación automática de fecha de entrega y usuario que entrega

#### Comprobante de ingreso en PDF (1.0.0)
- Página imprimible con datos del taller (desde Ajustes), folio, cliente, equipo, fechas
- Botón "Comprobante PDF" en el detalle de la orden
- Estilo optimizado para impresión/PDF vía navegador

#### Ajustes del taller (1.0.0)
- Pantalla exclusiva para ADMIN: nombre del taller, moneda, teléfono, dirección, logo

#### Gestión de usuarios (1.0.0)
- Pantalla exclusiva para ADMIN: listado, creación, activar/desactivar, cambio de rol

#### Dashboard (1.0.0)
- Tarjetas de conteo por cada estado de orden (enlazables al listado filtrado)
- Tabla de órdenes atrasadas con las 10 más antiguas

### Cambiado

- Layout del dashboard ahora usa layout anidado en vez de sidebar inline
- Sidebar con enlaces condicionales para ADMIN (Ajustes, Usuarios)
- Server actions organizadas en `lib/actions/`
- Esquemas de validación con Zod en `lib/validations.ts`
- Utilidades de formato en `lib/utils.ts`
