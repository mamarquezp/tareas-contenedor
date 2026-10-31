import type { NextConfig } from 'next';

// ─────────────────────────────────────────────────────────────────────────────
// Aquí falta UNA línea, y es la que más peso te va a quitar en la ronda 2.
// Cuando la pongas, `next build` deja en .next/standalone un servidor con
// SOLO los node_modules que de verdad se usan en tiempo de ejecución.
//
// Pista: está en la documentación de Next bajo «self-hosting».
// ─────────────────────────────────────────────────────────────────────────────
const nextConfig: NextConfig = {};

export default nextConfig;
