import { listarTareas } from '@/lib/tareas';

export const dynamic = 'force-dynamic';

export default async function Inicio() {
  const { tareas, origen } = await listarTareas();

  return (
    <main>
      <h1>Tareas Pro</h1>
      <p className="sub">Semana 16 · DevOps y entrega continua</p>
      <div className="tarjeta">
        <ul>
          {tareas.map((t) => (
            <li key={t.id}>
              <span>{t.hecha ? '✓' : '○'}</span>
              <span>{t.titulo}</span>
            </li>
          ))}
        </ul>
        <p className="pie">
          Origen de los datos: <code>{origen}</code> · Salud en <code>/api/salud</code>
        </p>
      </div>
    </main>
  );
}
