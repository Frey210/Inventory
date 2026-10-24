"use client";
import Link from "next/link";
import { useState } from "react";
import { CheckSquare, MapPin, Printer } from "lucide-react";
import { ItemVisual } from "./inventory-visuals";
export function LabelPicker({
  rows,
  type,
}: {
  rows: {
    id: string;
    code: string;
    name: string;
    photoId?: string | null;
    location?: string;
  }[];
  type: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <fieldset className="panel label-picker">
      <legend className="sr-only">Pilih label untuk dicetak</legend>
      <div className="label-selection">
        <button
          type="button"
          className="secondary"
          disabled={!rows.length}
          onClick={() =>
            setSelected(
              selected.length === rows.length ? [] : rows.map((r) => r.id),
            )
          }
        >
          <CheckSquare size={18} aria-hidden />
          {selected.length && selected.length === rows.length
            ? "Lepas halaman"
            : "Pilih halaman"}
        </button>
        <span role="status">
          <strong>{selected.length} label</strong> dipilih
        </span>
        {selected.length > 0 ? (
          <Link
            className="button"
            href={`/admin/labels?type=${type}&print=1&ids=${selected.join(",")}`}
          >
            <Printer size={18} aria-hidden /> Siapkan cetak
          </Link>
        ) : (
          <button type="button" disabled>
            <Printer size={18} aria-hidden /> Siapkan cetak
          </button>
        )}
      </div>
      <div className="label-list-heading" aria-hidden>
        <span>Barang dan identitas</span>
        <span>Lokasi penyimpanan</span>
      </div>
      <div className="label-list">
        {rows.map((row) => (
          <label
            className={`label-option ${selected.includes(row.id) ? "is-selected" : ""}`}
            key={row.id}
          >
            <input
              type="checkbox"
              aria-label={`Pilih ${row.code} ${row.name}`}
              checked={selected.includes(row.id)}
              onChange={(e) =>
                setSelected(
                  e.target.checked
                    ? [...selected, row.id]
                    : selected.filter((id) => id !== row.id),
                )
              }
            />
            <ItemVisual name={row.name} photoId={row.photoId} />
            <span className="label-identity">
              <strong>{row.name}</strong>
              <small>{row.code}</small>
            </span>
            <span className="label-location">
              <MapPin size={14} aria-hidden />
              {row.location || "Belum dicatat"}
            </span>
          </label>
        ))}
        {!rows.length && (
          <div className="empty">
            <Printer size={32} aria-hidden />
            <h2>Label tidak ditemukan</h2>
            <p>Ubah kata pencarian atau pilih jenis label lain.</p>
          </div>
        )}
      </div>
      <p className="label-selection-help">
        Pilihan berlaku untuk halaman ini. Maksimal 100 label per cetak.
      </p>
    </fieldset>
  );
}
