"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

export function UnitPicker({
  id,
  options,
  value,
  onChange,
  empty,
  error,
}: {
  id: string;
  options: { id: string; name: string }[];
  value: string[];
  onChange: (ids: string[]) => void;
  empty: string;
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const rows = options.filter((option) =>
    option.name
      .toLocaleLowerCase("id-ID")
      .includes(search.trim().toLocaleLowerCase("id-ID")),
  );
  return (
    <fieldset
      id={id}
      tabIndex={-1}
      className="unit-picker"
      aria-describedby={`${id}-help`}
      aria-invalid={!!error}
    >
      <legend>Pilih unit alat</legend>
      <div className="unit-picker-toolbar">
        <label className="unit-picker-search">
          <Search size={18} aria-hidden />
          <input
            type="search"
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
            aria-label="Cari tag atau lokasi unit"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari tag atau lokasi…"
          />
        </label>
        <span>{value.length} unit dipilih</span>
        {value.length > 0 && (
          <button
            type="button"
            className="secondary"
            onClick={() => onChange([])}
          >
            <X size={16} aria-hidden />
            Bersihkan
          </button>
        )}
      </div>
      <div className="unit-picker-options">
        {rows.map((option) => (
          <label
            key={option.id}
            className={`unit-picker-option ${value.includes(option.id) ? "is-selected" : ""}`}
          >
            <input
              type="checkbox"
              checked={value.includes(option.id)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...value, option.id]
                    : value.filter((item) => item !== option.id),
                )
              }
            />
            <span>{option.name}</span>
          </label>
        ))}
        {!rows.length && (
          <p className="unit-picker-empty">
            {options.length
              ? "Tidak ada unit yang cocok dengan pencarian."
              : empty}
          </p>
        )}
      </div>
      <p id={`${id}-help`} className="field-help">
        Centang unit yang dipindahkan. Jumlah mengikuti pilihan; tidak perlu
        menahan Ctrl atau Shift.
      </p>
      {error && <p className="field-error">{error}</p>}
    </fieldset>
  );
}
