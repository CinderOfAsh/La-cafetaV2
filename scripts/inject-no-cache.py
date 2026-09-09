#!/usr/bin/env python3
"""
Post-build script: modifica el server.js del standalone para añadir
Cache-Control: no-store a TODAS las respuestas HTML.

El problema: el HTML del Next.js standalone se cachea en navegadores y CDNs,
y como cada deploy genera chunks con nombres nuevos, el HTML viejo
referencia chunks que ya no existen y la UI se rompe al recargar.

Solución: inyectar el header Cache-Control: no-store en TODAS las respuestas
del server.js. Esto fuerza al navegador a descargar siempre la versión
actual.

Uso:
    python3 scripts/inject-no-cache.py
"""

import re
import sys
from pathlib import Path

STANDALONE_DIR = Path('.next/standalone/server.js')
BACKUP_SUFFIX = '.bak-nocache'

def inject_no_store_header(content: str) -> str:
    """Añade Cache-Control: no-store al server.js."""

    # Buscar el patrón del Next.js donde se envía la respuesta
    # El server.js tiene: process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig)
    # Buscamos donde se inicializa el servidor para añadir headers antes

    # Estrategia: modificar setHeader para forzar Cache-Control cuando se llame
    # El servidor Next.js tiene una función setHeader que podemos wrappear

    # Buscar dónde se llama a http.createServer o similar
    if 'http.ServerResponse' in content or 'createServer' in content:
        # Buscar la primera ocurrencia de ".writeHead" o ".setHeader("
        # e inyectar antes
        pass

    # Estrategia más simple: añadir un monkey-patch al final del archivo
    # que wrap la función require de next/dist para añadir headers

    patch = """

// === CACHE-CONTROL: NO-STORE PATCH (inyectado por scripts/inject-no-cache.py) ===
const _originalCreateServer = require('http').createServer;
require('http').createServer = function(...args) {
  const server = _originalCreateServer.apply(this, args);
  server.on('request', (req, res) => {
    // Solo HTML, no API ni assets
    if (req.method === 'GET' && !req.url.startsWith('/_next/') && !req.url.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  });
  return server;
};
// === FIN PATCH ===
"""

    # Buscar el require('next') para añadir después
    # Buscamos la última línea del archivo que tiene un patrón reconocible
    lines = content.split('\n')

    # Encontrar el final del archivo (después de startServer({...}))
    insert_idx = None
    for i in range(len(lines) - 1, -1, -1):
        if '})' in lines[i] or '};' in lines[i]:
            insert_idx = i + 1
            break

    if insert_idx is None:
        insert_idx = len(lines)

    # Insertar el patch
    new_lines = lines[:insert_idx] + patch.split('\n') + lines[insert_idx:]
    return '\n'.join(new_lines)


def main():
    if not STANDALONE_DIR.exists():
        print(f'Error: {STANDALONE_DIR} no existe. Ejecuta primero: npx next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/')
        sys.exit(1)

    backup_path = STANDALONE_DIR.with_suffix(STANDALONE_DIR.suffix + BACKUP_SUFFIX)
    if not backup_path.exists():
        # Backup
        content_orig = STANDALONE_DIR.read_text()
        backup_path.write_text(content_orig)
        print(f'Backup: {backup_path}')

    content = STANDALONE_DIR.read_text()

    # Verificar si ya está parcheado
    if 'CACHE-CONTROL: NO-STORE PATCH' in content:
        print('Ya está parcheado. Nada que hacer.')
        return

    new_content = inject_no_store_header(content)

    if new_content == content:
        print('Error: no se pudo inyectar el patch.')
        sys.exit(1)

    STANDALONE_DIR.write_text(new_content)
    print(f'✓ Patch inyectado en {STANDALONE_DIR}')
    print(f'  Tamaño antes: {len(content)} bytes')
    print(f'  Tamaño después: {len(new_content)} bytes')


if __name__ == '__main__':
    main()
