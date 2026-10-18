import Link from "next/link";
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
} from "lucide-react";
import { Logout } from "./auth-client";
import type { Actor } from "@/server/policy";
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
  const nav = tech
    ? ([
        ["/me", "Beranda", LayoutDashboard],
        ["/me/items", "Cari Barang", Search],
        ["/me/requests/new", "Request Barang", ClipboardCheck],
        ["/me/pickups", "Ambil Barang", ScanLine],
        ["/me/loans", "Pinjaman & Kembali", RotateCcw],
        ["/me/incidents/new", "Laporkan Masalah", Wrench],
        ["/me/history", "Riwayat", History],
        ["/profile", "Profil", UserRound],
      ] as const)
    : ([
        ["/admin/dashboard", "Dashboard", LayoutDashboard],
        ["/admin/masters", "Master Data", Settings],
        ["/admin/items", "Inventory", Boxes],
        ["/admin/receipts", "Barang Masuk", PackagePlus],
        ["/admin/requests", "Persetujuan", ClipboardCheck],
        ["/admin/overrides", "Review Darurat", ShieldCheck],
        ["/admin/loans", "Pinjaman", ScanLine],
        ["/admin/returns", "Pemeriksaan Kembali", RotateCcw],
        ["/admin/transfers", "Transfer", ArrowLeftRight],
        ["/admin/stocktakes", "Stock Opname", ClipboardCheck],
        ["/admin/maintenance", "Maintenance & Kalibrasi", Wrench],
        ["/admin/reports", "Laporan", FileText],
        ["/admin/audit", "Audit Log", History],
        ...(actor.role === "ADMIN"
          ? ([
              ["/admin/users", "Pengguna", Users],
              ["/admin/settings", "Pengaturan", ShieldCheck],
            ] as const)
          : []),
        ["/profile", "Profil", UserRound],
      ] as const);
  const links = nav.map(([href, label, Icon]) => (
    <Link
      key={href}
      href={href}
      aria-current={
        path === href || (href !== "/me" && path.startsWith(href + "/"))
          ? "page"
          : undefined
      }
    >
      <Icon size={18} aria-hidden />
      {label}
    </Link>
  ));
  return (
    <div className={`shell ${tech ? "technician" : ""}`}>
      <aside className="sidebar">
        <Link href="/" className="brand">
          <Image src="/logo.jpg" alt="" width={40} height={40} />
          MTC Inventory
        </Link>
        <nav aria-label="Menu utama">{links}</nav>
        <div className="sidebar-footer">
          PT MEDIA TEKNOLOGI CELEBES
          <br />
          <small style={{ color: "#d3e4fa" }}>
            Inventory & Asset Management
          </small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <details className="mobile-menu">
            <summary>Menu</summary>
            <nav aria-label="Menu mobile">{links}</nav>
          </details>
          <span className="muted">MTC Inventory</span>
          <div className="account">
            <Link href="/notifications">Notifikasi</Link>
            <span>
              {actor.name}
              <small style={{ display: "block" }}>{actor.role}</small>
            </span>
            <Logout />
          </div>
        </header>
        <main id="main" className="content">
          <div className="alert warning">
            Mode persiapan/pilot — verifikasi saldo pembukaan, QMS dan UAT
            sebelum operasional penuh.
          </div>
          {children}
        </main>
      </div>
      {tech && (
        <nav className="bottom-nav" aria-label="Navigasi cepat">
          {[
            ["/me", "Beranda"],
            ["/me/items", "Cari"],
            ["/me/requests/new", "Request"],
            ["/me/loans", "Pinjaman"],
            ["/profile", "Profil"],
          ].map(([url, title]) => (
            <Link key={url} href={url}>
              {title}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
