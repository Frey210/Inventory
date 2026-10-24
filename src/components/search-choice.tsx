"use client";
import { useId, useState } from "react";
export function SearchChoice({
  options,
  value,
  text = "",
  required,
  freeText = false,
  onChange,
  id,
}: {
  options: { id: string; name: string }[];
  value: string;
  text?: string;
  required?: boolean;
  freeText?: boolean;
  onChange: (id: string, text: string) => void;
  id?: string;
}) {
  const list = useId();
  const [search, setSearch] = useState(
    options.find((o) => o.id === value)?.name || text,
  );
  return (
    <>
      <input
        id={id}
        type="search"
        list={list}
        value={search}
        required={required}
        maxLength={freeText ? 200 : 500}
        placeholder={
          freeText
            ? "Pilih saran atau ketik lokasi lain"
            : "Cari kode atau nama barang"
        }
        autoComplete="off"
        onChange={(event) => {
          const next = event.target.value;
          const option = options.find((o) => o.name === next);
          setSearch(next);
          event.target.setCustomValidity(
            !freeText && next && !option
              ? "Pilih barang dari saran katalog."
              : "",
          );
          onChange(option?.id || "", option ? "" : next);
        }}
      />
      <datalist id={list}>
        {options.map((o) => (
          <option key={o.id} value={o.name} />
        ))}
      </datalist>
    </>
  );
}
