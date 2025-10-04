import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const RESERVED = new Set(['admin', 'api', 'graphql', 'graphql-playground', '_next', 'assets', 'favicon.ico', 'robots.txt']);

export async function GET(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const segments = params?.slug ?? [];
  const first = (segments[0] || '').toLowerCase();

  // Отдаём системные/бэкенд маршруты как есть — пусть их обработает Next/Payload
  if (RESERVED.has(first)) {
    return new Response(null, { status: 404 });
  }

  // Отдаём SPA index.html из public
  const __dirname = fileURLToPath(new URL('.', import.meta.url));
  const indexPath = join(__dirname, '../../public/index.html');

  try {
    const html = await readFile(indexPath, 'utf8');
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch {
    // Если по какой-то причине index.html не найден
    return new Response('Frontend not built or index.html missing.', { status: 500 });
  }
}
