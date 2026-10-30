"use client";
import { useActionState, useEffect, useRef, useState, useId } from "react";
import { perform, type FormState } from "@/app/actions";
import Image from "next/image";
import Link from "next/link";
import { quantityInput } from "@/lib/quantity-input";
import { SearchChoice } from "./search-choice";
import { useActionFeedback } from "./action-feedback";
import { UnitPicker } from "./unit-picker";
import {
  Save,
  Send,
  Check,
  RotateCcw,
  ArrowLeftRight,
  PackageCheck,
  LoaderCircle,
  Plus,
  KeyRound,
  UserPlus,
  RefreshCw,
  X,
  Wrench,
} from "lucide-react";
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
  fractional?: boolean;
  min?: string;
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
  fractional?: boolean;
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
  const notify = useActionFeedback();
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [state, dispatch, pending] = useActionState(
    async (previous: FormState, form: FormData) => {
      notify(null);
      const result = await perform(previous, form);
      if (result.success) {
        setKey(crypto.randomUUID());
        if (action === "transfer")
          setValues((current) => ({
            ...current,
            assetIds: [],
            ...(isSerializedTransfer(current.itemId) ? { quantity: "0" } : {}),
          }));
        notify(result.success);
      }
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
      clientKey: crypto.randomUUID(),
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
  function isSerializedTransfer(itemId: unknown) {
    return (
      action === "transfer" &&
      fields
        .find((f) => f.name === "itemId")
        ?.options?.find((o) => o.id === itemId)?.details?.tracking ===
        "serialized"
    );
  }
  function change(name: string, value: unknown) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      if (action === "transfer") {
        const serialized = isSerializedTransfer(next.itemId);
        if (name === "itemId" || name === "sourceId") {
          next.assetIds = [];
          if (serialized) next.quantity = "0";
          else if (name === "itemId") next.quantity = "1";
        }
        if (name === "assetIds" && serialized)
          next.quantity = String((value as string[]).length);
      }
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
  function numeric(field: Field) {
    const selected = (name: string) =>
      fields
        .find((f) => f.name === name)
        ?.options?.find((o) => o.id === values[name])?.details;
    const fractional =
      field.name === "minStock"
        ? selected("typeId")?.tracking !== "serialized" &&
          !!selected("unitId")?.fractional
        : field.name === "quantity" && action === "transfer"
          ? !!selected("itemId")?.fractional
          : field.fractional;
    return {
      ...quantityInput(
        fractional,
        field.name === "minStock" || field.name.startsWith("counts."),
      ),
      ...(field.min ? { min: field.min } : {}),
    };
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
  const serializedTransfer = isSerializedTransfer(values.itemId);
  const SubmitIcon =
    (
      {
        request: Send,
        "revise-request": Send,
        approve: Check,
        inspect: Check,
        "post-stocktake": Check,
        issue: PackageCheck,
        checkout: PackageCheck,
        "request-return": RotateCcw,
        "receive-return": RotateCcw,
        transfer: ArrowLeftRight,
        password: KeyRound,
        "user-reset": KeyRound,
        "user-create": UserPlus,
        "retry-pdf": RefreshCw,
        "post-receipt": Check,
        acknowledge: Check,
        reject: X,
        cancel: X,
        "cancel-stocktake": X,
        maintenance: Wrench,
      } as Record<string, typeof Save>
    )[action] || Save;
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
        <div className="alert success">
          {state.success}
          {action === "receipt" && state.id && (
            <p>
              <Link href={`/admin/receipts/${state.id}`}>
                Tinjau draft dan tag unit
              </Link>
            </p>
          )}
        </div>
      )}
      {items && (
        <fieldset>
          <legend>Daftar barang</legend>
          {lines.map((line, index) => {
            const item = items.find((i) => i.id === line.itemId);
            return (
              <div className="line-editor" key={line.clientKey}>
                <label htmlFor={`${prefix}-lines-${index}-itemId`}>
                  Barang
                  <SearchChoice
                    id={`${prefix}-lines-${index}-itemId`}
                    required
                    value={line.itemId}
                    options={items.map((i) => ({
                      id: i.id,
                      name: `${i.sku} — ${i.name}`,
                    }))}
                    onChange={(itemId) =>
                      setLines(
                        lines.map((l, i) =>
                          i === index
                            ? {
                                ...l,
                                itemId,
                                quantity:
                                  action === "receipt" &&
                                  items.find((x) => x.id === itemId)
                                    ?.tracking === "serialized"
                                    ? "1"
                                    : l.quantity,
                                locationId:
                                  items.find((x) => x.id === itemId)
                                    ?.locationId || "",
                              }
                            : l,
                        ),
                      )
                    }
                  />
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
                    {...quantityInput(
                      item?.tracking === "quantity" && item.fractional,
                    )}
                    readOnly={
                      action === "receipt" && item?.tracking === "serialized"
                    }
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
                      Tag internal
                      <input
                        readOnly
                        placeholder="Otomatis saat draft disimpan"
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
                      Nomor seri pabrikan (opsional)
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
                {item?.tracking === "serialized" && action === "receipt" && (
                  <label>
                    Tambahkan unit serupa (maks. {100 - lines.length})
                    <input
                      type="number"
                      min="0"
                      max={100 - lines.length}
                      step="1"
                      defaultValue="0"
                      id={`${prefix}-bulk-${index}`}
                    />
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        const input = document.getElementById(
                          `${prefix}-bulk-${index}`,
                        ) as HTMLInputElement;
                        if (!input.reportValidity()) return;
                        const count = Number(input.value);
                        if (
                          !Number.isInteger(count) ||
                          count < 1 ||
                          count + lines.length > 100
                        )
                          return;
                        setLines([
                          ...lines,
                          ...Array.from({ length: count }, () => ({
                            ...line,
                            clientKey: crypto.randomUUID(),
                            quantity: "1",
                            tag: "",
                            serial: "",
                          })),
                        ]);
                        input.value = "0";
                      }}
                    >
                      Tambahkan rincian unit
                    </button>
                  </label>
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
            disabled={lines.length >= 100}
            onClick={() =>
              setLines([
                ...lines,
                {
                  itemId: "",
                  clientKey: crypto.randomUUID(),
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
            <Plus size={17} aria-hidden />
            Tambah Baris ({lines.length}/100)
          </button>
        </fieldset>
      )}
      <div className="form-grid">
        {fields.map((field) =>
          field.type === "multiselect" ? (
            action === "transfer" && values.itemId && !serializedTransfer ? (
              <p className="field-help full" key={field.name}>
                Barang ini dicatat per jumlah; unit alat tidak perlu dipilih.
              </p>
            ) : (
              <UnitPicker
                key={`${field.name}-${values.itemId}-${values.sourceId}-${key}`}
                id={`${prefix}-${field.name}`}
                value={(values[field.name] as string[]) || []}
                options={(field.options || []).filter(
                  (o) =>
                    action !== "transfer" ||
                    (o.details?.itemId === values.itemId &&
                      o.details?.locationId === values.sourceId),
                )}
                onChange={(ids) => change(field.name, ids)}
                empty={
                  !values.itemId || !values.sourceId
                    ? "Pilih barang dan lokasi asal terlebih dahulu."
                    : "Tidak ada unit yang dapat dipindahkan dari lokasi ini."
                }
                error={state.fieldErrors?.[field.name]}
              />
            )
          ) : (
            <label
              key={field.name}
              className={
                field.type === "textarea"
                  ? "full"
                  : field.type === "checkbox"
                    ? "checkbox-field"
                    : ""
              }
            >
              <span>
                {field.label}
                {field.required && <span className="required"> (Wajib)</span>}
              </span>
              {field.name === "targetLocationId" ? (
                <SearchChoice
                  options={(field.options || []).map((o) => ({
                    id: o.id,
                    name: o.name,
                  }))}
                  value={String(values.targetLocationId || "")}
                  text={String(values.targetLocationText || "")}
                  freeText
                  onChange={(id, text) =>
                    setValues((current) => ({
                      ...current,
                      targetLocationId: id,
                      targetLocationText: text,
                    }))
                  }
                />
              ) : action === "transfer" && field.name === "itemId" ? (
                <SearchChoice
                  id={`${prefix}-${field.name}`}
                  options={field.options || []}
                  value={String(values[field.name] || "")}
                  required
                  onChange={(id) => change(field.name, id)}
                />
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
                  readOnly={serializedTransfer && field.name === "quantity"}
                  {...(field.type === "number" ? numeric(field) : {})}
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
              {serializedTransfer && field.name === "quantity" && (
                <small>Jumlah mengikuti unit yang dicentang.</small>
              )}
            </label>
          ),
        )}
      </div>
      {children}
      <div className="form-footer">
        <button
          className={
            [
              "reject",
              "cancel",
              "cancel-stocktake",
              "close-exception",
            ].includes(action)
              ? "danger-button"
              : undefined
          }
          disabled={
            pending ||
            (serializedTransfer &&
              !(values.assetIds as string[] | undefined)?.length)
          }
          aria-busy={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle size={18} className="loading-spinner" aria-hidden />
          ) : (
            <SubmitIcon size={18} aria-hidden />
          )}
          {pending ? "Memproses…" : label}
        </button>
        <span aria-live="polite">
          {pending
            ? "Permintaan sedang diproses. Jangan tutup halaman."
            : serializedTransfer &&
                !(values.assetIds as string[] | undefined)?.length
              ? "Pilih minimal satu unit alat."
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
