import {
  Cpu,
  Radio,
  Wrench,
  Cable,
  FlaskConical,
  HardHat,
  Package,
  CircuitBoard,
  MapPin,
  ArrowUpRight,
  Search,
  Plus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function ItemVisual({
  name,
  photoId,
  large = false,
}: {
  name: string;
  photoId?: string | null;
  large?: boolean;
}) {
  const text = name.toLowerCase();
  const Icon = /sensor|rk500|salinity|oxygen|ph\b/.test(text)
    ? Radio
    : /esp|pcb|arduino|board|modul|elektronik|komponen/.test(text)
      ? CircuitBoard
      : /kabel|cable|konektor|jst/.test(text)
        ? Cable
        : /kimia|larutan|buffer|alkohol|laboratorium|beaker/.test(text)
          ? FlaskConical
          : /apd|helm|safety|rompi|glove/.test(text)
            ? HardHat
            : /alat|tang|obeng|bor|solder|tool|multimeter/.test(text)
              ? Wrench
              : /aquanotes|produk/.test(text)
                ? Cpu
                : Package;
  return (
    <span
      className={`item-visual ${large ? "large" : ""} ${Icon === Radio ? "sensor" : Icon === CircuitBoard ? "circuit" : Icon === Wrench ? "tool" : ""}`}
    >
      {photoId ? (
        <Image
          src={`/api/files/${photoId}`}
          alt={name}
          width={large ? 320 : 120}
          height={large ? 280 : 120}
          unoptimized
        />
      ) : (
        <Icon size={large ? 96 : 38} strokeWidth={1.4} aria-hidden />
      )}
      {!photoId && large && (
        <span className="visual-caption">Ilustrasi kategori</span>
      )}
    </span>
  );
}
export function SearchBox({
  value,
  placeholder = "Cari nama atau kode barang…",
}: {
  value?: string;
  placeholder?: string;
}) {
  return (
    <div className="search-box">
      <Search size={21} aria-hidden />
      <input
        name="q"
        aria-label="Cari nama atau kode barang"
        defaultValue={value}
        placeholder={placeholder}
      />
    </div>
  );
}
export function EmptyState({
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
    <div className="empty-state">
      <Package size={44} strokeWidth={1.3} aria-hidden />
      <h3>{title}</h3>
      <p>{description}</p>
      {href && (
        <Link className="button" href={href}>
          <Plus size={18} aria-hidden />
          {action || "Tambah barang"}
        </Link>
      )}
    </div>
  );
}
export function LocationTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="location-tag">
      <MapPin size={14} aria-hidden />
      {children}
    </span>
  );
}
export function SectionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link className="section-link" href={href}>
      {children}
      <ArrowUpRight size={17} aria-hidden />
    </Link>
  );
}
