#!/bin/sh

echo "=== Teranga Biz Docker Entrypoint ==="

# Ensure data directory exists
mkdir -p /app/data

# Set DATABASE_URL explicitly
export DATABASE_URL="file:/app/data/commercio.db"

# Generate Prisma Client (ensure it matches the schema)
echo "[1/4] Generating Prisma Client..."
npx prisma generate 2>&1 || {
  echo "WARNING: Prisma generate failed, attempting to continue..."
}

# Push schema to database (don't exit on failure)
echo "[2/4] Pushing Prisma schema to database..."
DB_PUSH_OK=0
npx prisma db push --skip-generate --accept-data-loss 2>&1 || DB_PUSH_OK=1

if [ "$DB_PUSH_OK" -ne 0 ]; then
  echo "WARNING: prisma db push failed (exit code $DB_PUSH_OK)"
  echo "Attempting fallback SQL migration..."
  
  if [ ! -f "/app/data/commercio.db" ]; then
    echo "Database file does not exist yet — running prisma db push may need a different approach"
    npx prisma db push --skip-generate 2>&1 || true
  else
    echo "Database exists, applying raw SQL migrations..."
    sqlite3 /app/data/commercio.db "PRAGMA journal_mode=WAL;" 2>/dev/null || true
    sqlite3 /app/data/commercio.db "ALTER TABLE StoreSettings ADD COLUMN logoUrl TEXT;" 2>/dev/null && echo "  -> Added logoUrl column" || echo "  -> logoUrl column already exists or table not found"
    sqlite3 /app/data/commercio.db "ALTER TABLE StoreSettings ADD COLUMN primaryColor TEXT NOT NULL DEFAULT '#10B981';" 2>/dev/null && echo "  -> Added primaryColor column" || echo "  -> primaryColor column already exists or table not found"
  fi
  
  echo "Fallback migration completed."
else
  echo "  -> Schema pushed successfully."
fi

# Fix uploads path for standalone mode
echo "[3/4] Setting up uploads directory..."
mkdir -p /app/public/uploads/boutique /app/public/uploads/products /app/public/uploads/general

if [ -d "/app/.next/standalone/public" ]; then
  # Remove existing uploads dir in standalone (it was copied empty at build)
  rm -rf /app/.next/standalone/public/uploads
  
  # Symlink: standalone serves from .next/standalone/public/uploads
  # but uploads go to /app/public/uploads — make them the same
  ln -sf /app/public/uploads /app/.next/standalone/public/uploads
  echo "  -> Symlinked /app/public/uploads -> /app/.next/standalone/public/uploads"
else
  echo "  -> Not in standalone mode, uploads directory already set up."
fi

echo "[4/4] Starting application server..."
exec node .next/standalone/server.js
