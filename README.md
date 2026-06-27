# Sistema de Gestión para Taller de Reparación de Computadoras

Aplicación web para administrar un taller de reparación de computadoras.
Cubre el flujo completo: recepción de equipos, diagnóstico, presupuesto, reparación y entrega.

## Stack

- **Next.js 16 (App Router) + TypeScript**
- **PostgreSQL**
- **Prisma 7** (ORM + migraciones + Driver Adapter)
- **Docker** (desarrollo y producción)
- **Autenticación propia** por sesión (JWT, email + contraseña con hash, roles ADMIN / TECNICO)

## Funcionalidades v1

- **Dashboard** con tarjetas de conteo por estado y tabla de órdenes atrasadas
- **Clientes**: CRUD completo, búsqueda por nombre/teléfono
- **Órdenes**: registro de ingreso (con selección de cliente existente o creación inline), listado con filtros, detalle completo
- **Máquina de estados**: transiciones validadas en servidor, control de tiempos, alerta visual de atrasadas
- **Diagnósticos**: creación desde la orden, historial, aprobación/rechazo
- **Entrega**: acción dedicada cuando la orden está lista, captura de costo y notas
- **Comprobante de ingreso en PDF**: página imprimible con datos del taller
- **Ajustes del taller** (solo ADMIN): nombre, moneda, teléfono, dirección, logo
- **Gestión de usuarios** (solo ADMIN): crear, activar/desactivar, cambiar rol
- **Moneda configurable** desde Ajustes, formateo con `Intl.NumberFormat`
- **Sidebar responsiva** con enlaces condicionales según el rol

## Requisitos

- Docker y Docker Compose (recomendado)
- O Node.js 20+ y PostgreSQL 16+ (desarrollo local)

## Correr en local con Docker (Windows)

```bash
# 1. Clonar
git clone <repo-url>
cd sistema-taller-pc

# 2. Variables de entorno (opcional, hay defaults)
cp .env.example .env

# 3. Iniciar
docker compose up --build
```

La aplicación estará disponible en `http://localhost:3000`.

El primer arranque ejecuta automáticamente migraciones y seed (usuario ADMIN + ajustes).

### Usuario por defecto

| Campo | Valor |
|---|---|
| Email | `admin@taller.com` |
| Contraseña | `admin123` |

## Desarrollo local (sin Docker)

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar y editar variables de entorno
cp .env.example .env
# Editar DATABASE_URL con tu PostgreSQL local

# 3. Setup completo (crea DB, migraciones, seed)
npm run setup

# 4. Iniciar servidor de desarrollo
npm run dev
```

### Comandos útiles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run generate` | Generar Prisma Client |
| `npm run db:create` | Crear la base de datos si no existe |
| `npm run db:migrate` | Aplicar migraciones pendientes |
| `npm run db:seed` | Ejecutar seed |
| `npm run db:dev` | Crear migración en desarrollo |
| `npm run db:studio` | Abrir Prisma Studio |
| `npm run setup` | Crear DB + migraciones + seed (todo en uno) |

## Despliegue con EasyPanel

1. Crear un servicio **Aplicación** desde el repositorio Git (usa el `Dockerfile` del proyecto, puerto `3000`).
2. Agregar un servicio PostgreSQL administrado.
3. Configurar variables de entorno:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión a PostgreSQL |
| `SESSION_SECRET` | Clave para cifrar sesiones (generar con `openssl rand -base64 32`) |
| `ADMIN_EMAIL` | Email del admin inicial |
| `ADMIN_PASSWORD` | Contraseña del admin inicial |
| `ADMIN_NOMBRE` | Nombre del admin inicial |
| `TALLER_NOMBRE` | Nombre del taller |
| `TALLER_MONEDA` | Moneda ISO 4217 (MXN, ARS, COP, USD...) |

4. Desplegar.

> **⚠️ Seguridad obligatoria antes de exponer en producción:**
> - Cambia `SESSION_SECRET` por un valor único generado con `openssl rand -base64 32`
> - Cambia `ADMIN_PASSWORD` por una contraseña segura
> - El sistema rechazará el arranque en producción si `SESSION_SECRET` sigue siendo el valor de relleno

## Actualizaciones

```bash
git pull
docker compose up --build
```

Las migraciones corren automáticamente al iniciar. Revisa `CHANGELOG.md` para cambios de base de datos.

## Respaldos

### Con Docker
```bash
docker exec -t <postgres-container> pg_dump -U postgres taller_pc > respaldo_$(date +%Y%m%d).sql
```

### Con EasyPanel
Usar la funcionalidad de backups integrada.

## Licencia

MIT
