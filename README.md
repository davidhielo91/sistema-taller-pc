# Sistema de Gestión para Taller de Reparación de Computadoras

Aplicación web interna para registrar ingresos de equipos, diagnósticos, presupuestos y entregas.
Cada taller despliega su propia copia con su propia base de datos (no hay datos compartidos entre talleres).

---

## Funcionalidades

### v1.0 — Base completa

- **Clientes:** registro y búsqueda por nombre, teléfono o email.
- **Órdenes de trabajo:** recepción de equipos con folio autoincremental, datos del equipo, falla reportada y accesorios entregados.
- **Máquina de estados:** 9 estados (`Recibido → En diagnóstico → Presupuestado → Aprobado → En reparación → Listo → Entregado`, con ramas de rechazo y cancelación). Alertas visuales de órdenes atrasadas.
- **Diagnósticos:** registro de hallazgos, solución propuesta y costo estimado. Aprobación/rechazo del cliente desde la misma vista.
- **Nota de entrega:** costo, trabajo realizado y notas al momento de entregar.
- **Comprobante de ingreso:** página de impresión/PDF con datos del taller, folio, equipo y fechas.
- **Ajustes del taller:** nombre, moneda (ISO 4217), teléfono y dirección. Solo ADMIN.
- **Gestión de usuarios:** crear técnicos y administradores, activar/desactivar, cambiar rol. Solo ADMIN.
- **Dashboard:** conteo de órdenes por estado y lista de las 10 más atrasadas.
- **Multi-moneda:** los montos y fechas se formatean según la moneda configurada (MXN, ARS, COP, USD, EUR, etc.).

### v1.1 — Trazabilidad y pagos

- **Bitácora de estados:** cada cambio de estado queda registrado con fecha, hora y técnico. Se muestra como línea de tiempo en el detalle de la orden.
- **Pagos y abonos:** registro de cobros parciales o totales (monto, método, nota). La orden muestra costo total, total abonado y saldo pendiente. Estado de pago (`Sin pagar / Abonado / Pagado`) visible en el listado con filtro.

---

## Tabla de contenidos

1. [Antes de empezar — Variables de entorno](#1-antes-de-empezar--variables-de-entorno)
2. [Opción A — Correr en Windows con Docker (local)](#2-opción-a--correr-en-windows-con-docker-local)
3. [Opción B — Desplegar en VPS con EasyPanel (producción)](#3-opción-b--desplegar-en-vps-con-easypanel-producción)
4. [Cómo actualizar a una versión nueva](#4-cómo-actualizar-a-una-versión-nueva)
5. [Cómo respaldar la base de datos](#5-cómo-respaldar-la-base-de-datos)
6. [Advertencias de seguridad](#6-advertencias-de-seguridad)
7. [Referencia de comandos (para desarrolladores)](#7-referencia-de-comandos-para-desarrolladores)

---

## 1. Antes de empezar — Variables de entorno

El sistema se configura mediante variables de entorno. Están documentadas en `.env.example`.

Las variables más importantes son:

| Variable | Para qué sirve |
|---|---|
| `DATABASE_URL` | URL de conexión a PostgreSQL |
| `SESSION_SECRET` | Clave para cifrar las sesiones de usuario |
| `ADMIN_EMAIL` | Email del usuario administrador inicial |
| `ADMIN_PASSWORD` | Contraseña del usuario administrador inicial |
| `ADMIN_NOMBRE` | Nombre visible del administrador |
| `TALLER_NOMBRE` | Nombre del taller (aparece en la interfaz y comprobantes) |
| `TALLER_MONEDA` | Moneda ISO 4217 (MXN, ARS, COP, USD, EUR…) |

> **Nota:** En desarrollo local con Docker, el archivo `.env` es opcional porque `docker-compose.yml` ya tiene valores de ejemplo. Para producción (EasyPanel), las variables se configuran directamente en el panel.

---

## 2. Opción A — Correr en Windows con Docker (local)

Esta opción levanta la aplicación completa en tu máquina usando Docker Desktop. Es ideal para probar el sistema o para uso interno en red local.

### Requisitos previos

- **Docker Desktop** instalado y corriendo en Windows.
  Descárgalo en: https://www.docker.com/products/docker-desktop/
  (Verifica que esté activo: debe aparecer el ícono de Docker en la barra de tareas.)
- **Git** instalado.
  Descárgalo en: https://git-scm.com/download/win

### Pasos para instalar

Abre **PowerShell** o **Git Bash** y ejecuta los siguientes comandos uno por uno:

```bash
# 1. Clona el repositorio
git clone https://github.com/TU_USUARIO/sistema-taller-pc.git
cd sistema-taller-pc

# 2. (Opcional) Copia el archivo de variables de entorno para personalizar
cp .env.example .env
# Si no lo copias, Docker usará los valores de ejemplo (admin@taller.com / admin123).

# 3. Construye y levanta los contenedores
docker compose up --build
```

La primera vez tarda varios minutos porque descarga las imágenes de Node.js y PostgreSQL y construye la aplicación. Verás mensajes como:

```
>>> Paso 1/3: Aplicando migraciones de base de datos...
>>> Paso 2/3: Ejecutando seed inicial...
>>> Paso 3/3: Iniciando servidor en el puerto 3000...
```

Cuando aparezca `Ready in Xms`, abre el navegador en:

**http://localhost:3000**

### Credenciales por defecto (valores de ejemplo)

| Campo | Valor |
|---|---|
| Email | `admin@taller.com` |
| Contraseña | `admin123` |

> Cambia la contraseña desde la pantalla de Usuarios después de entrar.

### Cómo detenerlo

En la terminal donde corre Docker, presiona `Ctrl + C`.
Para detenerlo completamente y liberar los puertos:

```bash
docker compose down
```

> `docker compose down` NO borra los datos de la base de datos. Los datos persisten en el volumen `pgdata` y están disponibles la próxima vez que levantes el sistema.

### Cómo volver a levantarlo (sin reconstruir)

Si ya construiste la imagen antes y no hay cambios de código:

```bash
docker compose up
```

---

## 3. Opción B — Desplegar en VPS con EasyPanel (producción)

EasyPanel es un panel de control que simplifica el despliegue de aplicaciones Docker en un VPS. Puedes instalarlo desde https://easypanel.io.

Esta guía asume que ya tienes EasyPanel funcionando en tu servidor.

### Paso 1 — Subir el código a GitHub

Si aún no tienes el repositorio en GitHub, hazlo ahora. EasyPanel clona el código directamente desde allí.

### Paso 2 — Crear el servicio de PostgreSQL en EasyPanel

1. Entra a EasyPanel y abre (o crea) tu **proyecto**.
2. Haz clic en **"Create Service"** → selecciona **"Postgres"**.
3. Configura:
   - **Service name**: `postgres` (o el nombre que prefieras)
   - **Database**: `taller_pc`
   - **Username**: `postgres`
   - **Password**: elige una contraseña segura y anótala
4. Haz clic en **"Create"**.
5. Una vez creado, abre el servicio de Postgres y busca la sección **"Connection"** o **"Internal URL"**. Copia la **URL de conexión interna**. Tiene un formato similar a:
   ```
   postgresql://postgres:TU_PASSWORD@nombre-servicio:5432/taller_pc
   ```
   Guarda esta URL — la necesitarás en el Paso 4.

### Paso 3 — Crear el servicio de la aplicación

1. En el mismo proyecto, haz clic en **"Create Service"** → selecciona **"App"**.
2. Configura:
   - **Service name**: `taller-pc` (o el nombre que quieras)
   - **Source**: selecciona **"GitHub"** y conecta tu repositorio.
   - **Branch**: `main` (o `master`)
   - **Build method**: **"Dockerfile"** (EasyPanel lo detecta automáticamente)
   - **Port**: `3000`
3. Haz clic en **"Create"** (aún no despliegues).

### Paso 4 — Configurar las variables de entorno

Antes de desplegar, entra al servicio de la aplicación → pestaña **"Environment"** y agrega las siguientes variables:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La URL interna de Postgres del Paso 2 |
| `SESSION_SECRET` | Un valor seguro generado con `openssl rand -base64 32` |
| `ADMIN_EMAIL` | Tu email de administrador |
| `ADMIN_PASSWORD` | Una contraseña segura (mínimo 8 caracteres) |
| `ADMIN_NOMBRE` | Tu nombre |
| `TALLER_NOMBRE` | El nombre de tu taller |
| `TALLER_MONEDA` | Tu moneda: MXN, ARS, COP, USD, etc. |

> **Importante:** Deja vacío el campo **"Start command"** o **"Entrypoint"** de EasyPanel. El Dockerfile ya incluye el script de arranque que corre las migraciones automáticamente. Si EasyPanel lo sobreescribe, las migraciones no correrán.

### Paso 5 — Configurar el dominio y SSL

1. En la pestaña **"Domains"** del servicio, agrega tu dominio o subdominio (por ejemplo `taller.miempresa.com`).
2. EasyPanel configura SSL automáticamente con Let's Encrypt. Asegúrate de que el dominio ya apunta a tu VPS (registro DNS tipo A al IP del servidor).

### Paso 6 — Desplegar

1. Haz clic en **"Deploy"**.
2. Sigue los logs en tiempo real. Verás:
   ```
   >>> Paso 1/3: Aplicando migraciones de base de datos...
   >>> Paso 2/3: Ejecutando seed inicial...
   >>> Paso 3/3: Iniciando servidor en el puerto 3000...
   ```
3. Cuando los logs muestren `Ready`, abre tu dominio en el navegador.
4. Inicia sesión con las credenciales que configuraste en las variables de entorno.

### Notas importantes para EasyPanel

- El servicio de Postgres y el servicio de la app deben estar en el **mismo proyecto** de EasyPanel para que la URL interna funcione.
- Si tu proveedor de PostgreSQL requiere SSL (algunos servicios cloud), agrega `?sslmode=require` al final del `DATABASE_URL`.
- El primer despliegue puede tardar 5–10 minutos porque construye la imagen de Docker completa.

---

## 4. Cómo actualizar a una versión nueva

### En local con Docker

```bash
# 1. Descarga los cambios más recientes
git pull

# 2. Reconstruye y reinicia los contenedores
docker compose up --build
```

Las migraciones de base de datos se aplican automáticamente al reiniciar. Revisa el `CHANGELOG.md` para saber si la versión que descargaste incluye cambios en la base de datos.

> Los datos existentes no se pierden. Las migraciones solo agregan o modifican la estructura — nunca eliminan datos.

### En local sin Docker (solo desarrolladores)

Si corres la app directamente con `npm run dev` (sin Docker), debes aplicar las migraciones manualmente después de hacer `git pull`:

```bash
git pull
npm run db:migrate   # aplica las migraciones pendientes
npm run dev
```

### En EasyPanel

1. Haz push de los cambios a GitHub (o deja que tu colega lo haga).
2. En EasyPanel, entra al servicio de la app y haz clic en **"Deploy"** (o activa el despliegue automático desde la pestaña "General" → "Auto deploy on push").
3. EasyPanel reconstruirá la imagen y al reiniciar el contenedor las migraciones correrán solas.

---

## 5. Cómo respaldar la base de datos

Los respaldos son responsabilidad de cada taller. Aquí van dos opciones:

### Opción A — En local con Docker

Ejecuta este comando para crear un archivo SQL con todos los datos:

```bash
docker exec -t sistema-taller-pc-postgres-1 pg_dump -U postgres taller_pc > respaldo_$(date +%Y%m%d_%H%M%S).sql
```

> Nota: el nombre `sistema-taller-pc-postgres-1` puede variar. Puedes ver el nombre exacto del contenedor con `docker ps`.

Para restaurar un respaldo:

```bash
# 1. Copia el archivo SQL al contenedor
docker cp respaldo_20260101_120000.sql sistema-taller-pc-postgres-1:/tmp/respaldo.sql

# 2. Restaura (¡CUIDADO: sobreescribe todos los datos actuales!)
docker exec -i sistema-taller-pc-postgres-1 psql -U postgres -d taller_pc -f /tmp/respaldo.sql
```

### Opción B — En EasyPanel

EasyPanel ofrece snapshots automáticos del volumen de datos (dependiendo de tu plan). Para configurarlos:

1. Entra al servicio de Postgres en EasyPanel.
2. Busca la sección **"Backups"** o **"Snapshots"** y configura la frecuencia.

También puedes hacer un respaldo manual desde EasyPanel con el botón **"Backup now"** en la misma sección.

Para restaurar, usa el botón **"Restore"** junto al respaldo que quieras usar.

### Recomendaciones

- Haz respaldos antes de cada actualización.
- Guarda los archivos de respaldo en un lugar diferente al mismo servidor (otro disco, nube, correo).
- Prueba periódicamente que tus respaldos se pueden restaurar.

---

## 6. Advertencias de seguridad

- **`SESSION_SECRET`**: Debe ser único y secreto por instalación. Genera uno con `openssl rand -base64 32`. El sistema rechaza el arranque en producción si se deja el valor de relleno.
- **`ADMIN_PASSWORD`**: Cambia `admin123` por una contraseña segura antes de exponer el sistema a internet.
- **Archivo `.env`**: Nunca lo subas a GitHub. Ya está en `.gitignore`, pero verifica que así sea antes de hacer `git push`.
- **Acceso a la base de datos**: El puerto 5432 de Postgres no debe estar abierto al público. En Docker local, está disponible en `localhost:5432` solo para la máquina local. En EasyPanel, el servicio de Postgres es interno y no está expuesto por defecto.
- **Actualizaciones**: Revisa el `CHANGELOG.md` antes de actualizar para saber si hay cambios de base de datos o de configuración.

---

## 7. Referencia de comandos (para desarrolladores)

Para quienes quieren desarrollar sin Docker, necesitan Node.js 20+ y PostgreSQL 16+ instalados localmente.

```bash
# Instalar dependencias
npm install

# Copiar y editar variables de entorno
cp .env.example .env
# Editar DATABASE_URL con tu PostgreSQL local

# Setup completo (crea DB si no existe, aplica migraciones, crea seed)
npm run setup

# Servidor de desarrollo (con hot-reload)
npm run dev
```

### Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | Verificar estilo de código |
| `npm run generate` | Regenerar el cliente de Prisma |
| `npm run db:create` | Crear la base de datos si no existe |
| `npm run db:migrate` | Aplicar migraciones pendientes |
| `npm run db:seed` | Ejecutar el seed |
| `npm run db:dev` | Crear una nueva migración en desarrollo |
| `npm run db:studio` | Abrir Prisma Studio (explorador visual de la BD) |
| `npm run setup` | Crear BD + migraciones + seed (todo en uno) |

---

## Licencia

MIT
