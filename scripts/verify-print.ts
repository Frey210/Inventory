import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { renderLoanPdf } from "../src/server/documents/render";
const directory = ".impeccable/review";
await mkdir(directory, { recursive: true });
for (const [stage, count] of [
  ["initial", 1],
  ["partial", 35],
  ["final", 3],
] as const) {
  const date = "2026-10-18T04:00:00Z";
  const units = Array.from({ length: count }, (_, i) => ({
    id: `unit-${i}`,
    itemId: "sku-1",
    tag: `SIM-${String(i + 1).padStart(3, "0")}`,
    serial: `SERIAL-SIMULASI-IDENTITAS-PANJANG-${i}`,
    condition: "Baik",
    completeness: "Unit, kabel sensor, adaptor dan kotak penyimpanan lengkap.",
  }));
  const events =
    stage === "initial"
      ? []
      : [
          {
            type: "receive-return",
            actorName: "Petugas Gudang Simulasi",
            actorId: "staff",
            createdAt: date,
            payload: {
              assetIds: stage === "final" ? units.map((u) => u.id) : ["unit-0"],
              reason: "Diterima di loket; menunggu pemeriksaan.",
            },
          },
          {
            type: "inspect",
            actorName: "Petugas Gudang Simulasi",
            actorId: "staff",
            createdAt: date,
            payload: {
              assetIds: stage === "final" ? units.map((u) => u.id) : ["unit-0"],
              condition: "Baik",
              reason: "Kelengkapan cocok dengan snapshot awal.",
            },
          },
        ];
  const payload = {
    id: `SIM-${stage}`,
    number: `LOAN-SIM-${stage.toUpperCase()}`,
    status: stage === "final" ? "completed" : "active",
    createdAt: date,
    dueAt: "2026-10-25T04:00:00Z",
    cutoffAt: date,
    verificationCode: "SIMULASI-VERIFIKASI",
    snapshot: {
      borrower: { id: "borrower", name: "Teknisi Simulasi" },
      project: { name: "Proyek Simulasi Pengujian" },
      usageLocation: { name: "Lokasi Penggunaan Simulasi" },
      approver: { name: "Approver Simulasi" },
      approval: { createdAt: date },
      handover: { name: "Gudang Simulasi" },
      settings: { timezone: "Asia/Makassar" },
      request: {
        purpose: "Pengujian cetak Letter dengan identitas dan nama panjang.",
        acknowledgedAt: date,
      },
      items: [
        {
          id: "sku-1",
          name: "Perangkat pengukuran dan sensor identitas panjang untuk pengujian tabel",
        },
      ],
      units,
    },
    events,
    lines: units.map((u, i) => ({
      assetId: u.id,
      receivedAt:
        stage === "final" || (stage === "partial" && i === 0) ? date : null,
      inspectedAt:
        stage === "final" || (stage === "partial" && i === 0) ? date : null,
      inspection:
        stage === "final" || (stage === "partial" && i === 0)
          ? { condition: "Baik", reason: "Lengkap dan terverifikasi" }
          : null,
    })),
  };
  const pdf = await renderLoanPdf(
    payload,
    stage === "initial" ? 1 : 2,
    "https://inventory.example.invalid",
  );
  assert.ok(pdf.subarray(0, 4).toString() === "%PDF");
  await writeFile(`${directory}/nota-${stage}.pdf`, pdf);
  console.log(stage, count, "units PDF rendered");
}
