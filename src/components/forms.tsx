"use client";
import { useActionState, useEffect, useRef, useState, useId } from "react";
import { perform, type FormState } from "@/app/actions";
import Image from "next/image";
export type Option = {
  id: string;
  name: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
};
export type Field = {
  name: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "select"
    | "multiselect"
    | "checkbox"
    | "date"
    | "datetime-local"
    | "number"
    | "password"
    | "photo";
  required?: boolean;
  options?: Option[];
  value?: string | boolean | string[];
  help?: string;
};
export type CatalogItem = Option & {
  sku: string;
  tracking: string;
  unitId: string;
  locationId: string;
  photoId?: string | null;
  unitName?: string;
  categoryName?: string;
  specifications?: unknown;
};
const initial: FormState = {};
export function PrintButton() {
  return (
    <button className="no-print" type="button" onClick={() => window.print()}>
      Cetak Label
    </button>
  );
}
export function ActionForm({
  action,
  label = "Simpan",
  fields = [],
  base = {},
  items,
  locations,
  defaults,
  children,
  initialLines,
}: {
  action: string;
  label?: string;
  fields?: Field[];
  base?: Record<string, unknown>;
  items?: CatalogItem[];
  locations?: Option[];
  defaults?: Option[];
  children?: React.ReactNode;
  initialLines?: { itemId: string; locationId: string; quantity: string }[];
}) {
  const prefix = useId().replaceAll(":", "");
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [state, dispatch, pending] = useActionState(
    async (previous: FormState, form: FormData) => {
      const result = await perform(previous, form);
      if (result.success) setKey(crypto.randomUUID());
      return result;
    },
    initial,
  );
  const [values, setValues] = useState<Record<string, unknown>>({
    ...base,
    ...Object.fromEntries(
      fields.map((f) => [
        f.name,
        f.value ??
          (f.type === "checkbox" ? false : f.type === "multiselect" ? [] : ""),
      ]),
    ),
  });
  const [lines, setLines] = useState(() =>
    (initialLines?.length
      ? initialLines
      : [{ itemId: "", locationId: "", quantity: "1" }]
    ).map((line) => ({
      tag: "",
      serial: "",
      condition: "Baik",
      calibrationRequired: false,
      validUntil: "",
      ...line,
    })),
  );
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state]);
  function change(name: string, value: unknown) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      if (name === "categoryId") {
        const data = defaults?.find((c) => c.id === value)?.details || {};
        for (const [field, from] of [
          ["typeId", "defaultTypeId"],
          ["unitId", "defaultUnitId"],
          ["locationId", "defaultLocationId"],
          ["photoId", "photoId"],
        ])
          if (!next[field] && data[from]) next[field] = data[from];
      }
      return next;
    });
  }
  const payload: Record<string, unknown> = structuredClone({
    ...values,
    ...(items ? { lines } : {}),
  });
  for (const [name, value] of Object.entries(values))
    if (name.includes(".")) {
      const [group, field] = name.split(".");
      payload[group] = {
        ...((payload[group] as Record<string, unknown>) || {}),
        [field]: value,
      };
      delete payload[name];
    }
  if (action === "settings") payload.pickupHours = Number(payload.pickupHours);
  return (
    <form action={dispatch} className="data-form">
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="key" value={key} />
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      {state.error && (
        <div className="alert danger" role="alert" tabIndex={-1} ref={errorRef}>
          <strong>Periksa data</strong>
          <p>{state.error}</p>
          {state.fieldErrors && (
            <ul>
              {Object.entries(state.fieldErrors).map(([name, message]) => (
                <li key={name}>
                  <a href={`#${prefix}-${name}`}>{message}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {state.success && (
        <div className="alert success" role="status">
          {state.success}
        </div>
      )}
      {items && (
        <fieldset>
          <legend>Daftar barang</legend>
          {lines.map((line, index) => {
            const item = items.find((i) => i.id === line.itemId);
            return (
              <div className="line-editor" key={index}>
                <label>
                  Barang
                  <select
                    required
                    value={line.itemId}
                    onChange={(e) =>
                      setLines(
                        lines.map((l, i) =>
                          i === index
                            ? {
                                ...l,
                                itemId: e.target.value,
                                locationId:
                                  items.find((x) => x.id === e.target.value)
                                    ?.locationId || "",
                              }
                            : l,
                        ),
                      )
                    }
                  >
                    <option value="">Pilih barang</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.sku} — {i.name} (
                        {i.tracking === "quantity"
                          ? "komponen / bahan"
                          : "alat / aset"}
                        )
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Lokasi
                  <select
                    required
                    value={line.locationId}
                    onChange={(e) =>
                      setLines(
                        lines.map((l, i) =>
                          i === index
                            ? { ...l, locationId: e.target.value }
                            : l,
                        ),
                      )
                    }
                  >
                    <option value="">Pilih lokasi</option>
                    {locations?.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Jumlah
                  <input
                    required
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={line.quantity}
                    onChange={(e) =>
                      setLines(
                        lines.map((l, i) =>
                          i === index ? { ...l, quantity: e.target.value } : l,
                        ),
                      )
                    }
                  />
                </label>
                {item && (
                  <small className="full">
                    {item.name} · {item.categoryName} · Satuan: {item.unitName}{" "}
                    · {String(item.specifications || "Spesifikasi belum diisi")}
                    .{" "}
                    {item.tracking === "serialized"
                      ? action === "receipt"
                        ? "Satu unit alat per baris penerimaan."
                        : "Alat dikembalikan setelah digunakan."
                      : "Jumlah menggunakan satuan dasar katalog."}
                  </small>
                )}
                {item?.photoId && (
                  <Image
                    className="catalog-photo"
                    src={`/api/files/${item.photoId}`}
                    alt={`Foto ${item.name}`}
                    width={80}
                    height={80}
                    unoptimized
                  />
                )}
                {item?.tracking === "serialized" && action === "receipt" && (
                  <>
                    <label>
                      Asset tag
                      <input
                        required
                        value={line.tag}
                        onChange={(e) =>
                          setLines(
                            lines.map((l, i) =>
                              i === index ? { ...l, tag: e.target.value } : l,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      Serial
                      <input
                        value={line.serial}
                        onChange={(e) =>
                          setLines(
                            lines.map((l, i) =>
                              i === index
                                ? { ...l, serial: e.target.value }
                                : l,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      Kondisi
                      <select
                        value={line.condition}
                        onChange={(e) =>
                          setLines(
                            lines.map((l, i) =>
                              i === index
                                ? { ...l, condition: e.target.value }
                                : l,
                            ),
                          )
                        }
                      >
                        {["Baru", "Baik", "Rusak Ringan", "Rusak Berat"].map(
                          (c) => (
                            <option key={c}>{c}</option>
                          ),
                        )}
                      </select>
                    </label>
                    <label>
                      Memerlukan kalibrasi
                      <input
                        type="checkbox"
                        checked={line.calibrationRequired}
                        onChange={(e) =>
                          setLines(
                            lines.map((l, i) =>
                              i === index
                                ? {
                                    ...l,
                                    calibrationRequired: e.target.checked,
                                  }
                                : l,
                            ),
                          )
                        }
                      />
                    </label>
                  </>
                )}
                {lines.length > 1 && (
                  <button
                    className="secondary"
                    type="button"
                    onClick={() =>
                      setLines(lines.filter((_, i) => i !== index))
                    }
                  >
                    Hapus baris {index + 1}
                  </button>
                )}
              </div>
            );
          })}
          <button
            className="secondary"
            type="button"
            onClick={() =>
              setLines([
                ...lines,
                {
                  itemId: "",
                  locationId: "",
                  quantity: "1",
                  tag: "",
                  serial: "",
                  condition: "Baik",
                  calibrationRequired: false,
                  validUntil: "",
                },
              ])
            }
          >
            Tambah Baris
          </button>
        </fieldset>
      )}
      <div className="form-grid">
        {fields.map((field) => (
          <label
            key={field.name}
            className={field.type === "textarea" ? "full" : ""}
          >
            <span>
              {field.label}
              {field.required && <span className="required"> (Wajib)</span>}
            </span>
            {field.type === "multiselect" ? (
              <select
                multiple
                id={`${prefix}-${field.name}`}
                required={field.required}
                aria-invalid={!!state.fieldErrors?.[field.name]}
                aria-describedby={
                  state.fieldErrors?.[field.name]
                    ? `${prefix}-${field.name}-error`
                    : undefined
                }
                size={5}
                name={field.name}
                value={values[field.name] as string[]}
                onChange={(e) =>
                  change(
                    field.name,
                    Array.from(e.target.selectedOptions, (o) => o.value),
                  )
                }
              >
                {field.options?.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            ) : field.type === "select" ? (
              <select
                id={`${prefix}-${field.name}`}
                aria-invalid={!!state.fieldErrors?.[field.name]}
                aria-describedby={
                  state.fieldErrors?.[field.name]
                    ? `${prefix}-${field.name}-error`
                    : undefined
                }
                name={field.name}
                required={field.required}
                value={String(values[field.name] ?? "")}
                onChange={(e) => change(field.name, e.target.value)}
              >
                <option value="">Pilih {field.label.toLowerCase()}</option>
                {field.options?.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            ) : field.type === "checkbox" ? (
              <input
                type="checkbox"
                name={field.name}
                checked={!!values[field.name]}
                onChange={(e) => change(field.name, e.target.checked)}
              />
            ) : field.type === "textarea" ? (
              <textarea
                id={`${prefix}-${field.name}`}
                aria-invalid={!!state.fieldErrors?.[field.name]}
                aria-describedby={
                  state.fieldErrors?.[field.name]
                    ? `${prefix}-${field.name}-error`
                    : undefined
                }
                name={field.name}
                required={field.required}
                maxLength={5000}
                value={String(values[field.name] ?? "")}
                onChange={(e) => change(field.name, e.target.value)}
              />
            ) : field.type === "photo" ? (
              <Photo
                value={String(values[field.name] || "")}
                onChange={(v) => change(field.name, v)}
              />
            ) : (
              <input
                id={`${prefix}-${field.name}`}
                aria-invalid={!!state.fieldErrors?.[field.name]}
                aria-describedby={
                  state.fieldErrors?.[field.name]
                    ? `${prefix}-${field.name}-error`
                    : undefined
                }
                name={field.name}
                type={field.type || "text"}
                step={field.type === "number" ? "0.0001" : undefined}
                min={field.type === "number" ? "0" : undefined}
                required={field.required}
                value={String(values[field.name] ?? "")}
                onChange={(e) => change(field.name, e.target.value)}
                autoComplete={
                  field.type === "password" ? "new-password" : undefined
                }
              />
            )}
            {state.fieldErrors?.[field.name] && (
              <small
                className="field-error"
                id={`${prefix}-${field.name}-error`}
              >
                {state.fieldErrors[field.name]}
              </small>
            )}
            {field.help && <small>{field.help}</small>}
          </label>
        ))}
      </div>
      {children}
      <div className="form-footer">
        <button disabled={pending} type="submit">
          {pending ? "Menyimpan…" : label}
        </button>
        <span aria-live="polite">
          {pending
            ? "Permintaan sedang diproses. Jangan tutup halaman."
            : "Periksa kembali sebelum menyimpan."}
        </span>
      </div>
    </form>
  );
}
function Photo({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <span className="upload">
      {value && (
        <>
          <a href={`/api/files/${value}`} target="_blank" rel="noreferrer">
            <Image
              src={`/api/files/${value}`}
              alt="Pratinjau foto tersimpan"
              width={120}
              height={120}
              unoptimized
            />
          </a>
          <button
            type="button"
            className="secondary"
            onClick={() => onChange("")}
          >
            Hapus Foto dari Form
          </button>
        </>
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setError("");
          try {
            const body = new FormData();
            body.set("file", file);
            const response = await fetch("/api/files", {
              method: "POST",
              body,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Upload gagal.");
            onChange(result.id);
          } catch (error) {
            setError(error instanceof Error ? error.message : "Upload gagal.");
          } finally {
            setBusy(false);
          }
        }}
      />
      <small>JPEG/PNG/WebP, maksimum 5 MB. {busy ? "Mengunggah…" : ""}</small>
      {error && <span role="alert">{error}</span>}
    </span>
  );
}
