#!/bin/sh
set -e

echo "=== Teranga Biz Docker Entrypoint ==="

# Ensure data directory exists
mkdir -p /app/data

# Set DATABASE_URL explicitly
export DATABASE_URL="file:/app/data/commercio.db"

# Generate Prisma Client (ensure it matches the schema)
echo "[1/3] Generating Prisma Client..."
npx prisma generate 2>&1 || {
  echo "WARNING: Prisma generate failed, attempting to continue..."
}

# Push schema to database
echo "[2/3] Pushing Prisma schema to database..."
npx prisma db push --skip-generate --accept-data-loss 2>&1

# If prisma db push failed, try raw SQL fallback
if [ $? -ne 0 ]; then
  echo "WARNING: prisma db push failed, running SQL fallback..."
  
  # Check if the database file exists, if not create it
  if [ ! -f "/app/data/commercio.db" ]; then
    echo "Creating new database..."
    sqlite3 /app/data/commercio.db "SELECT 1;" 2>/dev/null || true
  fi
  
  # Run prisma db push one more time without --accept-data-loss
  echo "Retrying prisma db push..."
  npx prisma db push --skip-generate 2>&1 || {
    echo "ERROR: Could not sync database schema. Attempting raw SQL migration..."
    sqlite3 /app/data/commercio.db "
      PRAGMA journal_mode=WAL;
      -- Add logoUrl column if missing
      ALTER TABLE StoreSettings ADD COLUMN logoUrl TEXT;
    " 2>/dev/null || echo "(logoUrl column may already exist or table issue)"
    sqlite3 /app/data/commercio.db "
      -- Add primaryColor column if missing  
      ALTER TABLE StoreSettings ADD COLUMN primaryColor TEXT NOT NULL DEFAULT '#10B981';
    " 2>/dev/null || echo "(primaryColor column may already exist or table issue)"
    echo "Raw SQL migration completed (if table StoreBanner is missing, please check logs above)"
  }
fi

echo "[3/3] Starting application server..."
exec node .next/standalone/server.js
