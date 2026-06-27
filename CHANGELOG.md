# Changelog

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
