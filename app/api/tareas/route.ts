import { NextResponse } from 'next/server';
import { listarTareas } from '@/lib/tareas';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await listarTareas());
}
