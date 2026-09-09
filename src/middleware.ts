import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Forzar que el HTML y chunks NUNCA se cacheen en navegadores ni CDNs.
  // Esto evita el bug clásico de Next.js donde tras un deploy, el navegador
  // pide HTML viejo que referencia chunks que ya no existen.
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('Surrogate-Control', 'no-store')

  return response
}

// Aplicar a TODAS las rutas (HTML + chunks)
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (mantener su cache-control actual)
     * - _next/static (chunks estáticos, ya tienen hash en el nombre)
     * - favicon.ico, robots.txt, sitemap.xml
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
