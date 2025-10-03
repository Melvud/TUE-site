// server/migrations/00000000_init_migrations_table.js
// Создаёт служебную таблицу payload_migrations, если её ещё нет.
// Чистый CommonJS, без ESM/TS/TLA — безопасно для Render/Node 22.

const { Client } = require('pg');

function getSSL() {
  // Render часто требует SSL к PG. Совместимо с DATABASE_SSL='true'
  return process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: false }
    : undefined;
}

module.exports = {
  up: async () => {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: getSSL(),
    });
    await client.connect();

    // таблица для фиксации применённых миграций
    const sql = `
      CREATE TABLE IF NOT EXISTS payload_migrations (
        name        TEXT PRIMARY KEY,
        hash        TEXT,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await client.query(sql);
    await client.end();
    console.log('[init] ensured payload_migrations table exists');
  },

  down: async () => {
    // Обычно откатывать служебную таблицу не нужно.
    // Если очень хочется — раскомментируй:
    // const client = new Client({
    //   connectionString: process.env.DATABASE_URL,
    //   ssl: getSSL(),
    // });
    // await client.connect();
    // await client.query('DROP TABLE IF EXISTS payload_migrations;');
    // await client.end();
  },
};
