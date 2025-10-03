// server/migrations/00000000_init_migrations_table.js
// Гарантирует корректную схему служебной таблицы payload_migrations для Payload/Drizzle.
// Работает на Node 22/Render без TS/ESM.

const { Client } = require('pg');

function getSSL() {
  return process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: false }
    : undefined;
}

async function columnExists(client, table, column) {
  const { rows } = await client.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return rows.length > 0;
}

async function tableExists(client, table) {
  const { rows } = await client.query(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_name = $1`,
    [table]
  );
  return rows.length > 0;
}

module.exports = {
  up: async () => {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: getSSL(),
    });
    await client.connect();
    try {
      await client.query('BEGIN');

      const tbl = 'payload_migrations';
      const exists = await tableExists(client, tbl);

      // 1) Создадим целиком корректную таблицу при её отсутствии
      if (!exists) {
        await client.query(`
          CREATE TABLE ${tbl} (
            id          SERIAL PRIMARY KEY,
            name        TEXT NOT NULL UNIQUE,
            batch       INTEGER NOT NULL DEFAULT 1,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);
      } else {
        // 2) Таблица есть — добавим недостающие колонки аккуратно
        const needId = !(await columnExists(client, tbl, 'id'));
        const needName = !(await columnExists(client, tbl, 'name'));
        const needBatch = !(await columnExists(client, tbl, 'batch'));
        const needCreated = !(await columnExists(client, tbl, 'created_at'));
        const needUpdated = !(await columnExists(client, tbl, 'updated_at'));

        if (needName) {
          await client.query(`ALTER TABLE ${tbl} ADD COLUMN name TEXT`);
        }
        if (needBatch) {
          await client.query(`ALTER TABLE ${tbl} ADD COLUMN batch INTEGER`);
          await client.query(`UPDATE ${tbl} SET batch = 1 WHERE batch IS NULL`);
          await client.query(`ALTER TABLE ${tbl} ALTER COLUMN batch SET NOT NULL`);
          await client.query(`ALTER TABLE ${tbl} ALTER COLUMN batch SET DEFAULT 1`);
        }
        if (needCreated) {
          await client.query(`ALTER TABLE ${tbl} ADD COLUMN created_at TIMESTAMPTZ`);
          // если есть старое поле executed_at — используем его
          const hasExecutedAt = await columnExists(client, tbl, 'executed_at');
          if (hasExecutedAt) {
            await client.query(`UPDATE ${tbl} SET created_at = executed_at WHERE created_at IS NULL`);
          }
          await client.query(`UPDATE ${tbl} SET created_at = NOW() WHERE created_at IS NULL`);
          await client.query(`ALTER TABLE ${tbl} ALTER COLUMN created_at SET NOT NULL`);
          await client.query(`ALTER TABLE ${tbl} ALTER COLUMN created_at SET DEFAULT NOW()`);
        }
        if (needUpdated) {
          await client.query(`ALTER TABLE ${tbl} ADD COLUMN updated_at TIMESTAMPTZ`);
          await client.query(`UPDATE ${tbl} SET updated_at = COALESCE(updated_at, created_at, NOW())`);
          await client.query(`ALTER TABLE ${tbl} ALTER COLUMN updated_at SET NOT NULL`);
          await client.query(`ALTER TABLE ${tbl} ALTER COLUMN updated_at SET DEFAULT NOW()`);
        }
        if (needId) {
          await client.query(`ALTER TABLE ${tbl} ADD COLUMN id SERIAL`);
          // Проставим первичный ключ и уникальность name
          await client.query(`ALTER TABLE ${tbl} ADD PRIMARY KEY (id)`);
        }

        // Убедимся в уникальности name (Payload так ожидает)
        await client.query(`DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE schemaname = ANY (current_schemas(false))
              AND indexname = 'payload_migrations_name_key'
          ) THEN
            BEGIN
              -- попробуем добавить ограничение уникальности (если его ещё нет)
              ALTER TABLE ${tbl} ADD CONSTRAINT payload_migrations_name_key UNIQUE (name);
            EXCEPTION
              WHEN duplicate_table THEN
                -- индекс/ограничение уже появилось
                NULL;
              WHEN duplicate_object THEN
                NULL;
            END;
          END IF;
        END$$;`);
      }

      await client.query('COMMIT');
      console.log('[init] payload_migrations table is in the expected shape');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('[init] failed to ensure payload_migrations:', e);
      throw e;
    } finally {
      await client.end();
    }
  },

  down: async () => {
    // откат системной таблицы обычно не нужен
  },
};
