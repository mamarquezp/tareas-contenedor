import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * El contrato que tiene que cumplir tu imagen, pese lo que pese.
 * El script de medición no acepta un número si esta ruta no devuelve 200.
 */
export async function GET() {
  let base: 'conectada' | 'sin base' = 'sin base';

  if (process.env.DATABASE_URL) {
    try {
      const { sql } = await import('@/lib/db');
      await sql`SELECT 1`;
      base = 'conectada';
    } catch {
      base = 'sin base';
    }
  }

  return NextResponse.json({
    ok: true,
    servicio: 'tareas-contenedor',
    base,
    version: process.env.APP_VERSION ?? 'dev',
    // Útil para comprobar en qué usuario corre el contenedor.
    usuario: process.getuid ? String(process.getuid()) : 'desconocido',
  });
}
