import { z } from "zod";
export const quantity = z
  .string()
  .regex(
    /^\d{1,12}(\.\d{1,4})?$/,
    "Jumlah harus positif, maksimal empat angka desimal.",
  )
  .refine((v) => Number(v) > 0, "Jumlah harus lebih besar dari nol.");
export function eligible(
  unit: {
    availability: string;
    condition: string;
    technical: string;
    calibrationRequired: boolean;
    validUntil: Date | null;
  },
  now = new Date(),
  reserved = false,
) {
  return (
    unit.availability === (reserved ? "reserved" : "available") &&
    ["Baru", "Baik"].includes(unit.condition) &&
    ["Normal", "Kalibrasi Berlaku"].includes(unit.technical) &&
    (!unit.calibrationRequired || (!!unit.validUntil && unit.validUntil >= now))
  );
}
export function assertReturn(
  out: string,
  returned: string,
  waste: string,
  next: string,
) {
  const scaled = (value: string) => {
    const [whole, fraction = ""] = value.split(".");
    return BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, "0"));
  };
  if (
    scaled(next) <= 0n ||
    scaled(returned) + scaled(waste) + scaled(next) > scaled(out)
  )
    throw new Error("Jumlah kumulatif melebihi pengeluaran.");
}
export function ensureReason(reason: string) {
  if (reason.trim().length < 5)
    throw new Error("Alasan minimal lima karakter wajib diisi.");
}
