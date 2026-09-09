#!/usr/bin/env node
/**
 * Post-build script: modifica el server.js del standalone para añadir
 * Cache-Control: no-store a TODAS las respuestas HTML.
 *
 * El problema: el HTML del Next.js standalone se cachea en navegadores y CDNs,
 * y como cada deploy genera chunks con nombres nuevos, el HTML viejo
 * referencia chunks que ya no existen y la UI se rompe al recargar.
 *
 * Solución: inyectar el header Cache-Control: no-store en TODAS las respuestas
 * del server.js. Esto fuerza al navegador a descargar siempre la versión
 * actual.
 *
 * Uso: node scripts/inject-no-cache.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

const STANDALONE_PATH = '.next/standalone/server.js'
const BACKUP_PATH = '.next/standalone/server.js.bak-nocache'
const MARKER = 'CACHE-CONTROL: NO-STORE PATCH'

function buildPatch() {
  return `

// === ${MARKER} (inyectado por scripts/inject-no-cache.mjs) ===
// Wrap http.createServer para anadir Cache-Control: no-store a respuestas HTML.
const _originalCreateServer = require('http').createServer;
require('http').createServer = function(...args) {
  const server = _originalCreateServer.apply(this, args);
  server.on('request', (req, res) => {
    // Solo HTML, no API ni assets estaticos
    const url = req.url || '';
    if (req.method === 'GET'
        && !url.startsWith('/_next/')
        && !url.startsWith('/api/')
        && !url.includes('.')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
  });
  return server;
};
// === FIN PATCH ===
`
}

function main() {
  if (!existsSync(STANDALONE_PATH)) {
    console.error(`Error: ${STANDALONE_PATH} no existe.`)
    console.error('Ejecuta primero: npm run build')
    process.exit(1)
  }

  // Backup una sola vez
  if (!existsSync(BACKUP_PATH)) {
    const orig = readFileSync(STANDALONE_PATH, 'utf8')
    writeFileSync(BACKUP_PATH, orig)
    console.log(`Backup: ${BACKUP_PATH}`)
  }

  const content = readFileSync(STANDALONE_PATH, 'utf8')

  if (content.includes(MARKER)) {
    console.log('Ya esta parcheado. Nada que hacer.')
    return
  }

  // Encontrar donde insertar (antes del final del archivo)
  const lines = content.split('\n')
  let insertIdx = lines.length

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    if (line.trim().endsWith('})') || line.trim().endsWith('};')) {
      insertIdx = i + 1
      break
    }
  }

  const newLines = [
    ...lines.slice(0, insertIdx),
    ...buildPatch().split('\n'),
    ...lines.slice(insertIdx),
  ]
  const newContent = newLines.join('\n')

  if (newContent === content) {
    console.error('Error: no se pudo inyectar el patch.')
    process.exit(1)
  }

  writeFileSync(STANDALONE_PATH, newContent)
  console.log(`Patch inyectado en ${STANDALONE_PATH}`)
  console.log(`  Tamano antes: ${content.length} bytes`)
  console.log(`  Tamano despues: ${newContent.length} bytes`)
}

main()
