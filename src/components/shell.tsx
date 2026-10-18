import { NavigationLink as Link, SearchSubmit } from "./navigation";
import Form from "next/form";
import Image from "next/image";
import {
  LayoutDashboard,
  Boxes,
  PackagePlus,
  ClipboardCheck,
  ArrowLeftRight,
  ScanLine,
  RotateCcw,
  FileText,
  Settings,
  Users,
  History,
  ShieldCheck,
  Search,
  UserRound,
  Wrench,
  Bell,
  Menu,
  ChevronDown,
  FlaskConical,
  MapPin,
  Cpu,
} from "lucide-react";
import { Logout } from "./auth-client";
import type { Actor } from "@/server/policy";

const roleNames: Record<string, string> = {
  ADMIN: "Admin",
  WAREHOUSE: "Petugas gudang",
  TECHNICIAN: "Tim MTC",
  AUDITOR: "Manajemen",
};
export function Shell({
  actor,
  path,
  children,
}: {
  actor: Actor;
  path: string;
  children: React.ReactNode;
}) {
  const tech = actor.role === "TECHNICIAN";
  const home = tech ? "/me" : "/admin/dashboard";
  const primary = tech
    ? ([
        ["/me", "Beranda", LayoutDashboard],
        ["/me/items", "Barang", Boxes],
        ["/me/requests/new", "Ambil / pinjam", PackagePlus],
        ["/me/pickups", "Siap diambil", ClipboardCheck],
        ["/me/loans", "Pinjaman saya", RotateCcw],
      ] as const)
    : ([
        [home, "Beranda", LayoutDashboard],
        ["/admin/items", "Barang", Boxes],
        ["/admin/receipts", "Barang masuk", PackagePlus],
        ["/admin/requests", "Permintaan", ClipboardCheck],
        ["/admin/loans", "Peminjaman", ArrowLeftRight],
        ["/admin/returns", "Pengembalian", RotateCcw],
      ] as const);
  const manage = tech
    ? ([
        ["/me/incidents/new", "Laporkan masalah", Wrench],
        ["/me/consumable-returns/new", "Kembalikan sisa komponen", PackagePlus],
        ["/me/history", "Riwayat", History],
      ] as const)
    : ([
        ["/admin/masters", "Master Data", Settings],
        ["/admin/transfers", "Pindah rak", ArrowLeftRight],
        ["/admin/stocktakes", "Hitung stok", ClipboardCheck],
        ["/admin/maintenance", "Perawatan & kalibrasi", Wrench],
        ["/admin/reports", "Laporan", FileText],
        ["/admin/audit", "Riwayat aktivitas", History],
        ["/admin/overrides", "Tinjau pengambilan darurat", ShieldCheck],
        ...(actor.role === "ADMIN"
          ? ([
              ["/admin/users", "Anggota tim", Users],
              ["/admin/settings", "Pengaturan", Settings],
            ] as const)
          : []),
      ] as const);
  const active = (href: string) =>
    path === href || (href !== "/me" && path.startsWith(href + "/"));
  const links = (
    entries: ReadonlyArray<readonly [string, string, typeof Boxes]>,
  ) =>
    entries.map(([href, label, Icon]) => (
      <Link
        key={href}
        href={href}
        aria-current={active(href) ? "page" : undefined}
      >
        <Icon size={20} aria-hidden />
        <span>{label}</span>
      </Link>
    ));
  const quick = tech
    ? [
        primary[0],
        primary[1],
        ["/me/pickups", "Pindai", ScanLine] as const,
        ["/me/loans", "Pinjaman", RotateCcw] as const,
        ["/profile", "Profil", UserRound] as const,
      ]
    : [
        primary[0],
        primary[1],
        ["/admin/labels", "Label QR", ScanLine] as const,
        ["/admin/requests", "Pengajuan", ClipboardCheck] as const,
        ["/profile", "Profil", UserRound] as const,
      ];
  return (
    <div className={`shell ${tech ? "technician" : ""}`}>
      <aside className="sidebar">
        <Link href={home} className="brand">
          <Image src="/logo.jpg" alt="Logo MTC" width={44} height={44} />
          <span>
            MTC<span className="brand-subtitle">Inventory</span>
          </span>
        </Link>
        <div className="warehouse-label">
          <MapPin size={16} aria-hidden />
          Ruang kerja MTC
        </div>
        <nav aria-label="Menu utama">{links(primary)}</nav>
        <details
          className="management-menu"
          open={manage.some(([href]) => active(href))}
        >
          <summary>
            Kelola gudang
            <ChevronDown size={16} aria-hidden />
          </summary>
          <nav aria-label="Pengelolaan">{links(manage)}</nav>
        </details>
        <div className="sidebar-footer">
          <Cpu size={22} aria-hidden />
          <div>
            <strong>Built for our team.</strong>
            <span>PT Media Teknologi Celebes</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand">
            <Image src="/logo.jpg" alt="MTC" width={34} height={34} />
            <strong>MTC Inventory</strong>
          </div>
          <Form
            className="global-search"
            action={tech ? "/me/items" : "/admin/items"}
          >
            <Search size={19} aria-hidden />
            <input
              aria-label="Cari barang di gudang"
              name="q"
              placeholder="Cari barang, kode, atau sensor…"
            />
            <SearchSubmit className="search-submit" aria-label="Cari">
              <Search size={18} aria-hidden />
            </SearchSubmit>
          </Form>
          <div className="account">
            <Link
              className="icon-button"
              href="/notifications"
              aria-label="Notifikasi"
            >
              <Bell size={21} aria-hidden />
            </Link>
            <Link href="/profile" className="account-profile">
              <span className="avatar">
                {actor.name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")}
              </span>
              <span className="account-name">
                <strong>{actor.name}</strong>
                <small>{roleNames[actor.role] || actor.role}</small>
              </span>
            </Link>
            <div className="desktop-logout">
              <Logout />
            </div>
          </div>
        </header>
        <details className="mobile-menu">
          <summary>
            <Menu size={19} aria-hidden />
            Semua menu
            <ChevronDown size={16} aria-hidden />
          </summary>
          <nav aria-label="Menu mobile">
            {links(primary)}
            {links(manage)}
            <Link href="/profile">
              <UserRound size={20} aria-hidden />
              Profil & keamanan
            </Link>
            <Logout />
          </nav>
        </details>
        <main id="main" className="content">
          {process.env.APP_MODE !== "live" && (
            <details className="pilot-notice no-print">
              <summary>
                <FlaskConical size={16} aria-hidden />
                <span>Mode uji coba</span>
                <ChevronDown size={14} aria-hidden />
              </summary>
              <p>
                Gunakan untuk mencoba alur kerja. Sebelum dipakai penuh,
                cocokkan stok awal dengan barang fisik dan selesaikan uji
                bersama tim.
              </p>
            </details>
          )}
          {children}
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Navigasi cepat">
        {quick.map(([href, label, Icon]) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? "page" : undefined}
          >
            <Icon size={22} aria-hidden />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
