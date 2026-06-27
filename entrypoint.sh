#!/bin/sh
set -e

echo ""
echo "============================================"
echo " Sistema de Gestion - Taller de PC"
echo "============================================"
echo ""

echo ">>> Paso 1/3: Aplicando migraciones de base de datos..."
node node_modules/prisma/build/index.js migrate deploy
echo "    Listo."
echo ""

echo ">>> Paso 2/3: Ejecutando seed inicial (sin efecto si ya existe)..."
node prisma/seed.cjs
echo "    Listo."
echo ""

echo ">>> Paso 3/3: Iniciando servidor en el puerto ${PORT:-3000}..."
echo ""
exec node server.js
