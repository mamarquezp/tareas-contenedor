export type Tarea = { id: number; titulo: string; hecha: boolean };

/** Datos de respaldo para cuando no hay base. La aplicación nunca se cae por eso. */
export const SEMILLA: Tarea[] = [
  { id: 1, titulo: 'Medir la imagen de la ronda 0', hecha: true },
  { id: 2, titulo: 'Escribir el .dockerignore', hecha: false },
  { id: 3, titulo: 'Partir el Dockerfile en etapas', hecha: false },
  { id: 4, titulo: 'Dejar de correr como root', hecha: false },
];

export async function listarTareas(): Promise<{ tareas: Tarea[]; origen: string }> {
  if (!process.env.DATABASE_URL) return { tareas: SEMILLA, origen: 'memoria' };
  try {
    const { sql } = await import('./db');
    const filas = await sql<Tarea[]>`SELECT id, titulo, hecha FROM tareas ORDER BY id`;
    return { tareas: filas, origen: 'postgres' };
  } catch {
    return { tareas: SEMILLA, origen: 'memoria' };
  }
}
