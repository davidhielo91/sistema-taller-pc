FROM node:20-alpine AS base

# ── Dependencias ─────────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── Build ─────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Genera el cliente de Prisma (tipos + runtime para driver adapter)
RUN npx prisma generate

# Build de Next.js en modo standalone
RUN npm run build

# Compila el seed TypeScript a JS puro para el runner (sin tsx)
# Los paquetes externos (@prisma/client, pg, bcryptjs) se resuelven
# en el runner desde node_modules del standalone.
RUN npx esbuild prisma/seed.ts \
      --bundle \
      --platform=node \
      --target=node20 \
      --format=cjs \
      --outfile=prisma/seed.cjs \
      --external:@prisma/adapter-pg \
      --external:@prisma/client \
      --external:pg \
      --external:bcryptjs

# ── Imagen de producción ──────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Archivos públicos y de Prisma (esquema, migraciones, seed compilado)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

RUN mkdir .next
RUN chown nextjs:nodejs .next

# Build standalone de Next.js (incluye node_modules de producción)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cliente generado de Prisma — necesario para que la app se conecte a la BD.
# El standalone tracer de Next.js no garantiza su inclusión, por eso se copia
# explícitamente desde el builder (donde se generó con prisma generate).
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# CLI de Prisma — necesario para "prisma migrate deploy" en el arranque.
# Es una devDependency que no está en el standalone; se toma del stage deps
# que corrió sobre Alpine, así que los binarios son compatibles con este runner.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Script de inicio: migraciones → seed → servidor
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/bin/sh", "entrypoint.sh"]
