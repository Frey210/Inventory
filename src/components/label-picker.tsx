"use client";
import Link from "next/link";
import { useState } from "react";
export function LabelPicker({
  rows,
  type,
}: {
  rows: { id: string; code: string; name: string }[];
  type: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <fieldset className="panel">
      <legend>Pilih label untuk dicetak</legend>
      <div className="actions">
        <button
          type="button"
          className="secondary"
          onClick={() =>
            setSelected(
              selected.length === rows.length ? [] : rows.map((r) => r.id),
            )
          }
        >
          Pilih / lepas halaman ini
        </button>
        <span role="status">
          {selected.length} dipilih · maksimal 100 per cetak
        </span>
        {selected.length > 0 && (
          <Link
            className="button"
            href={`/admin/labels?type=${type}&print=1&ids=${selected.join(",")}`}
          >
            Siapkan cetak
          </Link>
        )}
      </div>
      {rows.map((row) => (
        <label className="label-option" key={row.id}>
          <input
            type="checkbox"
            checked={selected.includes(row.id)}
            onChange={(e) =>
              setSelected(
                e.target.checked
                  ? [...selected, row.id]
                  : selected.filter((id) => id !== row.id),
              )
            }
          />
          <span>
            <strong>{row.code}</strong> {row.name}
          </span>
        </label>
      ))}
      {!rows.length && <p>Tidak ada label yang cocok. Ubah pencarian.</p>}
    </fieldset>
  );
}
