// ═══════════════════════════════════════════════════════════════════════════
//  El juez de la competencia.
//
//  Construye tu imagen, la mide, la LEVANTA y le pega a /api/salud. Si no
//  responde 200, el número no cuenta: una imagen de 12 MB que no arranca
//  pesa infinito.
//
//    node scripts/medir.mjs --equipo "Squad 3" --ronda 0
//    node scripts/medir.mjs --equipo "Squad 3" --ronda 2 --archivo Dockerfile
//    node scripts/medir.mjs --resumen
//
//  Guarda todo en .mediciones.json, que está en el .gitignore: es tuyo.
// ═══════════════════════════════════════════════════════════════════════════
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const REGISTRO = '.mediciones.json';
const RONDAS = {
  0: 'Línea de base',
  1: 'Contexto y capas',
  2: 'Multietapa y standalone',
  3: 'Base mínima y sin root',
};

// ── argumentos ──────────────────────────────────────────────────────────────
const arg = (nombre, porDefecto = null) => {
  const i = process.argv.indexOf(nombre);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : porDefecto;
};
const bandera = (n) => process.argv.includes(n);

const equipo = arg('--equipo', 'sin-nombre');
const ronda = Number(arg('--ronda', '0'));
const archivo = arg('--archivo', 'Dockerfile');
const puerto = Number(arg('--puerto', '3999'));

const leer = () => (existsSync(REGISTRO) ? JSON.parse(readFileSync(REGISTRO, 'utf8')) : { equipo, rondas: {} });
const mb = (bytes) => Math.round(bytes / 1_000_000);

// ── resumen ─────────────────────────────────────────────────────────────────
if (bandera('--resumen')) {
  const d = leer();
  const base = d.rondas['0']?.mb;
  console.log(`\n  ${d.equipo}\n`);
  console.log('  Ronda  Qué                          Tamaño   Build    Reducción');
  console.log('  ─────  ───────────────────────────  ───────  ───────  ─────────');
  for (const n of [0, 1, 2, 3]) {
    const r = d.rondas[String(n)];
    if (!r) continue;
    const red = base && n > 0 ? `${Math.round((1 - r.mb / base) * 100)} %` : '—';
    console.log(
      `    ${n}    ${RONDAS[n].padEnd(27)}  ${String(r.mb + ' MB').padStart(7)}  ${String(r.segundos + ' s').padStart(7)}  ${red.padStart(9)}`,
    );
  }
  console.log('');
  process.exit(0);
}

// ── comprobaciones previas ──────────────────────────────────────────────────
const docker = (args, opts = {}) =>
  spawnSync('docker', args, { encoding: 'utf8', shell: process.platform === 'win32', ...opts });

if (docker(['version']).status !== 0) {
  console.log('\n  Docker no está corriendo. Abre Docker Desktop y vuelve a intentar.\n');
  process.exit(1);
}
if (!existsSync(archivo)) {
  console.log(`\n  No encuentro ${archivo}.\n`);
  process.exit(1);
}

const etiqueta = `tareas-contenedor:r${ronda}`;
const contenedor = `medicion-r${ronda}`;

// ── construir ───────────────────────────────────────────────────────────────
console.log(`\n  Construyendo ${etiqueta} con ${archivo} …\n`);
const t0 = Date.now();
const build = docker(['build', '-f', archivo, '-t', etiqueta, '.'], { stdio: 'inherit' });
const segundos = Math.round((Date.now() - t0) / 1000);

if (build.status !== 0) {
  console.log('\n  La construcción falló. Ese es el primer problema: arréglalo antes de medir.\n');
  process.exit(1);
}

// ── medir ───────────────────────────────────────────────────────────────────
const inspect = docker(['image', 'inspect', etiqueta, '--format', '{{.Size}}']);
const tamano = mb(Number(inspect.stdout.trim()));

// ── y sobre todo: ¿arranca? ─────────────────────────────────────────────────
docker(['rm', '-f', contenedor]);
const run = docker(['run', '-d', '--name', contenedor, '-p', `${puerto}:3000`, etiqueta]);
if (run.status !== 0) {
  console.log('\n  La imagen no arranca. El número no cuenta.\n');
  console.log(run.stderr);
  process.exit(1);
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
let responde = false;
let cuerpo = null;

for (let i = 0; i < 30; i++) {
  await dormir(1000);
  try {
    const r = await fetch(`http://localhost:${puerto}/api/salud`);
    if (r.ok) {
      cuerpo = await r.json();
      responde = true;
      break;
    }
  } catch {
    /* todavía no levanta */
  }
}

const logs = docker(['logs', '--tail', '15', contenedor]);
docker(['rm', '-f', contenedor]);

if (!responde) {
  console.log('\n  La imagen arrancó pero /api/salud nunca respondió en 30 segundos.');
  console.log('  Una imagen que no sirve no compite. Últimas líneas del contenedor:\n');
  console.log((logs.stdout || '') + (logs.stderr || ''));
  console.log('');
  process.exit(1);
}

// ── guardar e imprimir ──────────────────────────────────────────────────────
const datos = leer();
datos.equipo = equipo;
datos.rondas[String(ronda)] = { mb: tamano, segundos, usuario: cuerpo.usuario, cuando: new Date().toISOString() };
writeFileSync(REGISTRO, JSON.stringify(datos, null, 2));

const base = datos.rondas['0']?.mb;
const reduccion = base && ronda > 0 ? Math.round((1 - tamano / base) * 100) : 0;
const root = cuerpo.usuario === '0';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log(`║  RONDA ${ronda} · ${RONDAS[ronda].padEnd(48)}║`);
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log(`   Equipo        ${datos.equipo}`);
console.log(`   Tamaño        ${tamano} MB`);
console.log(`   Construcción  ${segundos} s`);
console.log(`   Responde      sí · ${JSON.stringify(cuerpo)}`);
console.log(`   Corre como    ${root ? 'root  ← eso cuesta puntos' : 'usuario ' + cuerpo.usuario}`);
if (ronda > 0 && base) console.log(`   Reducción     ${reduccion} % contra tu ronda 0 (${base} MB)`);

console.log('\n   Para el tablero, dicta estos tres números:\n');
console.log(`      ${datos.equipo}  ·  ronda ${ronda}  ·  ${tamano} MB  ·  ${segundos} s\n`);
