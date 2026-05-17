type CsvRow = Record<string, string | number | boolean | null>;

function escapeCsv(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function downloadCsv(rows: CsvRow[], filename: string) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(';')];

  for (const row of rows) {
    const values = headers.map((h) => {
      const val = row[h];
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
        return escapeCsv(formatDate(val));
      }
      return escapeCsv(val);
    });
    lines.push(values.join(';'));
  }

  const bom = '\uFEFF';
  const csv = bom + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
