import { escape } from "./documents/template";
export const spreadsheetSafe = (value: string) =>
  /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
export const csvReport = (rows: string[][]) =>
  "\ufeff" +
  rows
    .map((row) =>
      row
        .map((v) => '"' + spreadsheetSafe(v).replaceAll('"', '""') + '"')
        .join(","),
    )
    .join("\r\n");
export function printReport(title: string, rows: string[][]) {
  return `<!doctype html><html lang="id"><meta charset="utf-8"><title>${escape(title)}</title><style>body{font:10pt Arial;color:#263648}table{border-collapse:collapse;width:100%}th,td{border:1px solid #888;padding:5pt;text-align:left;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}@media print{button{display:none}}@page{size:Letter landscape;margin:15mm}</style><body><button onclick="window.print()">Cetak / Simpan PDF</button><h1>${escape(title)}</h1><p>MTC Inventory · Data persiapan · ${escape(new Date().toISOString())}</p><table><thead><tr>${rows[0].map((v) => `<th>${escape(v)}</th>`).join("")}</tr></thead><tbody>${rows
    .slice(1)
    .map(
      (row) => `<tr>${row.map((v) => `<td>${escape(v)}</td>`).join("")}</tr>`,
    )
    .join("")}</tbody></table></body></html>`;
}
