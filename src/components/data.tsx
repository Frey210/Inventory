import Link from "next/link";
import { getSettings } from "@/server/settings";
export const labels: Record<string, string> = {
  draft: "Draft",
  submitted: "Diajukan",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
  posted: "Diposting",
  fulfilled: "Sudah Diserahkan",
  available: "Tersedia",
  reserved: "Direservasi",
  borrowed: "Dipinjam",
  installed: "Terpasang",
  pending_inspection: "Menunggu Pemeriksaan",
  blocked: "Diblokir",
  active: "Aktif",
  completed: "Selesai",
  closed_with_exception: "Ditutup dengan Pengecualian",
  pending: "Menunggu Diproses",
  ready: "Siap Diunduh",
  failed: "Gagal Dibuat",
  review: "Menunggu Review",
  open: "Terbuka",
  received: "Diterima",
};
export function Badge({ value }: { value: string }) {
  const tone = [
    "available",
    "approved",
    "completed",
    "posted",
    "ready",
    "received",
  ].includes(value)
    ? "success"
    : ["blocked", "rejected", "failed"].includes(value)
      ? "danger"
      : [
            "pending_inspection",
            "pending",
            "submitted",
            "review",
            "expired",
            "closed_with_exception",
          ].includes(value)
        ? "warning"
        : "neutral";
  return <span className={`badge ${tone}`}>{labels[value] || value}</span>;
}
export function Table({
  headers,
  rows,
  empty = "Belum ada data.",
}: {
  headers: string[];
  rows: React.ReactNode[][];
  empty?: string;
}) {
  return (
    <>
      <p className="table-hint">
        Geser tabel ke kanan untuk kolom lainnya. Keyboard: fokus tabel, lalu
        gunakan tombol panah.
      </p>
      <div
        className="table-wrap"
        role="region"
        aria-label={headers.join(", ")}
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              {headers.map((h) => (
                <th scope="col" key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length}>
                  <div className="empty">{empty}</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
export function Heading({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {href && (
        <Link className="button" href={href}>
          {action || "Tambah"}
        </Link>
      )}
    </div>
  );
}
export async function DateLabel({ value }: { value: Date | null | undefined }) {
  const settings = await getSettings();
  return (
    <>
      {value
        ? new Intl.DateTimeFormat("id-ID", {
            timeZone: String(settings.timezone),
            dateStyle: "medium",
            timeStyle: "short",
          }).format(value)
        : "—"}
    </>
  );
}
