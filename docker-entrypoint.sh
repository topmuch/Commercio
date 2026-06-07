#!/bin/sh

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

# Push schema to database (don't exit on failure)
echo "[2/3] Pushing Prisma schema to database..."
DB_PUSH_OK=0
npx prisma db push --skip-generate --accept-data-loss 2>&1 || DB_PUSH_OK=1

if [ "$DB_PUSH_OK" -ne 0 ]; then
  echo "WARNING: prisma db push failed (exit code $DB_PUSH_OK)"
  echo "Attempting fallback SQL migration..."
  
  # Check if the database file exists
  if [ ! -f "/app/data/commercio.db" ]; then
    echo "Database file does not exist yet — running prisma db push may need a different approach"
    # Try creating the DB with prisma migrate
    echo "Trying prisma db push without --accept-data-loss..."
    npx prisma db push --skip-generate 2>&1 || true
  else
    echo "Database exists, applying raw SQL migrations..."
    # Fallback: raw SQL to add missing columns
    sqlite3 /app/data/commercio.db "PRAGMA journal_mode=WAL;" 2>/dev/null || true
    sqlite3 /app/data/commercio.db "ALTER TABLE StoreSettings ADD COLUMN logoUrl TEXT;" 2>/dev/null && echo "  -> Added logoUrl column" || echo "  -> logoUrl column already exists or table not found"
    sqlite3 /app/data/commercio.db "ALTER TABLE StoreSettings ADD COLUMN primaryColor TEXT NOT NULL DEFAULT '#10B981';" 2>/dev/null && echo "  -> Added primaryColor column" || echo "  -> primaryColor column already exists or table not found"
  fi
  
  echo "Fallback migration completed."
else
  echo "  -> Schema pushed successfully."
fi

echo "[3/3] Starting application server..."
exec node .next/standalone/server.js
