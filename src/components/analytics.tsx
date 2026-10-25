import "server-only";
import {
  DemandChart,
  ItemDemandChart,
  MemberShareChart,
} from "./analytics-charts";
import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  PackageCheck,
  Users,
  Wrench,
  ArrowUpRight,
} from "lucide-react";
import { getAnalytics } from "@/server/analytics";
import { getSettings } from "@/server/settings";
import type { Actor } from "@/server/capabilities";
import { Heading, Table } from "./data";
const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
function Ranking({
  rows,
  items = false,
}: {
  rows: { id: string; name: string; sku?: string; requests: number }[];
  items?: boolean;
}) {
  if (!rows.length)
    return (
      <p className="analytics-empty">
        Belum ada permintaan pada periode ini. Grafik akan terisi dari transaksi
        tim.
      </p>
    );
  return (
    <ol className="analytics-ranking">
      {rows.map((row) => (
        <li key={row.id}>
          <div>
            <span className="rank-title">
              {items ? (
                <Link href={`/admin/items/${row.id}`}>{row.name}</Link>
              ) : (
                <strong>{row.name}</strong>
              )}
              {row.sku && <small>{row.sku}</small>}
            </span>
            <span className="rank-count">
              {row.requests} <small>permintaan</small>
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
export async function Analytics({
  actor,
  days,
}: {
  actor: Actor;
  days?: string;
}) {
  const settings = await getSettings();
  const data = await getAnalytics(actor, days, String(settings.timezone));
  const number = (n: unknown) =>
    Number(String(n)).toLocaleString("id-ID", { maximumFractionDigits: 4 });
  return (
    <>
      <Heading
        title="Analitik gudang"
        description="Pahami kebutuhan tim dan pemakaian barang untuk membantu merencanakan pengadaan."
      />
      <div className="analytics-period">
        <nav aria-label="Periode analitik">
          {[30, 90, 180].map((days) => (
            <Link
              key={days}
              href={`?days=${days}`}
              aria-current={data.period.days === days ? "page" : undefined}
            >
              {days} hari
            </Link>
          ))}
        </nav>
        <span>
          {dateLabel(data.period.dates[0])} –{" "}
          {dateLabel(data.period.dates.at(-1)!)} · {String(settings.timezone)}
        </span>
        <Link href="/admin/reports" className="button secondary">
          Laporan & ekspor <ArrowUpRight size={17} aria-hidden />
        </Link>
      </div>
      <div className="stats analytics-kpis">
        {[
          {
            label: "Permintaan",
            value: data.counts.requests,
            help: "Pengajuan valid pada periode ini",
            Icon: ClipboardList,
          },
          {
            label: "Penyerahan",
            value: data.counts.handovers,
            help: "Transaksi yang sudah diposting",
            Icon: PackageCheck,
          },
          {
            label: "Pemohon aktif",
            value: data.counts.users,
            help: "Anggota yang mengajukan kebutuhan",
            Icon: Users,
          },
          {
            label: "Unit alat dipinjam",
            value: data.counts.units,
            help: "Unit yang diserahkan selama periode",
            Icon: Wrench,
          },
        ].map(({ label, value, help, Icon }) => (
          <div className="stat" key={label}>
            <span className="stat-label">
              <Icon size={18} aria-hidden />
              {label}
            </span>
            <strong>{number(value)}</strong>
            <small>{help}</small>
          </div>
        ))}
      </div>
      <div className="analytics-grid">
        <section className="panel">
          <h2>Tren kebutuhan tim</h2>
          <p className="analytics-note">
            Jumlah transaksi per hari; permintaan dan penyerahan dapat terjadi
            pada tanggal berbeda.
          </p>
          <DemandChart rows={data.trend} />
          {data.counts.requests === 0 && data.counts.handovers === 0 && (
            <p className="analytics-note">
              Belum ada transaksi pada periode ini. Tidak ada perkiraan atau
              data contoh yang ditampilkan.
            </p>
          )}
          <details className="analytics-table-summary">
            <summary>Lihat data harian</summary>
            <Table
              headers={["Tanggal", "Permintaan", "Penyerahan"]}
              rows={data.trend.map((r) => [
                dateLabel(r.day),
                r.requests,
                r.handovers,
              ])}
            />
          </details>
          <p className="analytics-note">
            Pengajuan ditolak, dibatalkan, atau digantikan revisi tidak
            dihitung. Persetujuan belum dianggap pemakaian barang.
          </p>
        </section>
        <section className="panel">
          <h2>Barang paling sering diminta</h2>
          <p className="analytics-note">
            Frekuensi pengajuan per SKU, bukan penjumlahan pcs dengan meter atau
            liter.
          </p>
          {!data.items.length && <Ranking rows={[]} items />}
          <ItemDemandChart rows={data.items} />
          <details className="analytics-table-summary">
            <summary>Lihat nama dan rincian barang</summary>
            <Ranking rows={data.items} items />
          </details>
        </section>
      </div>
      <section className="panel analytics-users">
        <h2>Permintaan menurut anggota tim</h2>
        <p className="analytics-note">
          Membantu koordinasi kebutuhan dan pengadaan; bukan ukuran
          produktivitas atau aktivitas login.
        </p>
        <div className="analytics-members-layout">
          <MemberShareChart rows={data.users} total={data.counts.requests} />
          <div>
            <h3>Anggota paling sering mengajukan</h3>
            <Ranking rows={data.users} />
            <p className="analytics-note">
              Delapan anggota teratas. Donut mencakup seluruh permintaan: empat
              anggota teratas dan anggota lainnya.
            </p>
          </div>
        </div>
      </section>
      <section className="panel analytics-procurement">
        <div className="section-heading">
          <div>
            <h2>Tinjauan procurement</h2>
            <p className="analytics-note">
              Komponen di batas minimum atau sudah dipakai pada periode ini.
              Dahulukan pemeriksaan stok yang menipis.
            </p>
          </div>
          <BarChart3 size={24} aria-hidden />
        </div>
        <Table
          headers={[
            "Barang",
            "Penyerahan",
            "Keluar",
            "Sisa kembali",
            "Tersedia sekarang",
            "Minimum",
            "Kondisi",
          ]}
          rows={data.procurement.map((row) => [
            <Link key="item" href={`/admin/items/${row.id}`}>
              <strong>{row.name}</strong>
              <small className="analytics-unit">
                {row.sku} · {row.unit}
              </small>
            </Link>,
            `${row.transactions} transaksi`,
            number(row.issued),
            number(row.returned),
            number(row.available),
            number(row.minimum),
            <span
              key="status"
              className={`badge ${row.available.lte(row.minimum) ? "warning" : "success"}`}
            >
              {row.available.lte(0)
                ? "Habis / tereservasi"
                : row.available.lte(row.minimum)
                  ? "Stok menipis"
                  : "Di atas minimum"}
            </span>,
          ])}
          empty="Belum ada komponen yang perlu ditinjau pada periode ini."
        />
        <p className="analytics-note">
          {data.procurement.length
            ? `Menampilkan ${data.procurement.length} dari ${data.procurement[0].total} SKU yang cocok. `
            : ""}
          Keluar/sisa kembali memakai mutasi fisik pada periode terpilih.
          Tersedia sekarang adalah fisik dikurangi reservasi, lintas rak. Sisa
          kembali bisa berasal dari pengeluaran periode sebelumnya. Ini bahan
          tinjauan, bukan pesanan pembelian otomatis.
        </p>
      </section>
    </>
  );
}
