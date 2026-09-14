-- Script para crear la tabla Report manualmente en Hostinger
-- Solo se necesita si el deploy automatico no la creo (Prisma db push fallo)
--
-- Como usar:
--   1. Sube este archivo al servidor: scp scripts/create-report-table.sql usuario@host:/tmp/
--   2. Ejecuta: ssh usuario@host "sqlite3 /path/dev.db < /tmp/create-report-table.sql"
--
-- IMPORTANTE: reemplazar /path/dev.db por la ruta real de la BD del snapshot

CREATE TABLE IF NOT EXISTS Report (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  seenByAdmin BOOLEAN NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS Report_userId_idx ON Report(userId);
CREATE INDEX IF NOT EXISTS Report_status_idx ON Report(status);
