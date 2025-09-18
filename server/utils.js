// server/utils.js
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Храним БД в server/data/db.json
const DB_DIR = path.resolve(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');

const DEFAULT_DB = {
  news: [],
  events: [],
  contacts: [],
  members: [],
};

async function ensureDbFile() {
  if (!fsSync.existsSync(DB_DIR)) {
    await fs.mkdir(DB_DIR, { recursive: true });
  }
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
  }
}

export async function readDB() {
  await ensureDbFile();
  const raw = await fs.readFile(DB_PATH, 'utf-8');
  try {
    const json = JSON.parse(raw);
    return { ...DEFAULT_DB, ...json };
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
    return { ...DEFAULT_DB };
  }
}

export async function writeDB(db) {
  await ensureDbFile();
  const json = JSON.stringify({ ...DEFAULT_DB, ...db }, null, 2);
  await fs.writeFile(DB_PATH, json, 'utf-8');
}

export function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 80);
}

export function getByIdOrSlug(list, idOrSlug) {
  return list.find((x) => x.id === idOrSlug || x.slug === idOrSlug);
}
