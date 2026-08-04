// Utilidad para descargar CSV desde el navegador
export function downloadCsv(data: Record<string, unknown>[], filename: string) {
  if (!data || data.length === 0) {
    // Crear CSV vacío con mensaje
    const blob = new Blob(['Sin datos\n'], { type: 'text/csv;charset=utf-8;' })
    triggerDownload(blob, filename)
    return
  }
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const v = row[h]
          if (v === null || v === undefined) return ''
          const s = String(v).replace(/"/g, '""')
          // Si contiene coma, salto de línea o comillas, envolver en comillas
          if (s.includes(',') || s.includes('\n') || s.includes('"')) return `"${s}"`
          return s
        })
        .join(',')
    ),
  ].join('\n')

  // BOM para que Excel detecte UTF-8
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, filename)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
