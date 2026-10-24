import Link from "next/link";
import Form from "next/form";
import Image from "next/image";
import QRCode from "qrcode";
import { db } from "@/server/db";
import { inventoryQr } from "@/lib/qr";
import { Heading } from "./data";
import { PrintButton } from "./forms";
import { LabelPicker } from "./label-picker";
import { SearchSubmit } from "./navigation";
import { Search, Boxes, Wrench, ChevronLeft, ChevronRight } from "lucide-react";
export async function Labels({
  query,
  actorId,
}: {
  query: Record<string, string | undefined>;
  actorId: string;
}) {
  const type = query.type === "ITEM" ? "ITEM" : "ASSET";
  const printing = query.print === "1" || !!query.asset;
  const ids = (query.ids || query.asset || "").split(",").filter(Boolean);
  if (
    printing &&
    (!ids.length ||
      ids.length > 100 ||
      ids.some((id) => !/^[a-zA-Z0-9_-]{1,128}$/.test(id)))
  )
    return <p role="alert">Pilih 1–100 label dari daftar sebelum mencetak.</p>;
  const search = query.q?.trim().slice(0, 200) || "";
  const pageSize = 25;
  const itemWhere = {
    ...(printing ? { id: { in: ids } } : {}),
    ...(search
      ? {
          OR: [
            { sku: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const assetWhere = {
    ...(printing ? { id: { in: ids } } : {}),
    ...(search
      ? {
          OR: [
            { tag: { contains: search, mode: "insensitive" as const } },
            {
              item: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              item: { sku: { contains: search, mode: "insensitive" as const } },
            },
          ],
        }
      : {}),
  };
  const total =
    type === "ITEM"
      ? await db.item.count({ where: itemWhere })
      : await db.asset.count({ where: assetWhere });
  const page = Math.min(
    Math.max(1, Number.parseInt(query.page || "1") || 1),
    Math.max(1, Math.ceil(total / pageSize)),
  );
  const rows =
    type === "ITEM"
      ? (
          await db.item.findMany({
            where: itemWhere,
            orderBy: { sku: "asc" },
            skip: printing ? 0 : (page - 1) * pageSize,
            take: printing ? 100 : pageSize,
          })
        ).map((i) => ({
          id: i.id,
          code: i.sku,
          name: i.name,
          photoId: i.photoId,
          locationId: i.locationId,
        }))
      : (
          await db.asset.findMany({
            where: assetWhere,
            include: { item: { select: { name: true, photoId: true } } },
            orderBy: { tag: "asc" },
            skip: printing ? 0 : (page - 1) * pageSize,
            take: printing ? 100 : pageSize,
          })
        ).map((a) => ({
          id: a.id,
          code: a.tag,
          name: a.item.name,
          photoId: a.item.photoId,
          locationId: a.locationId,
        }));
  const locations = printing
    ? []
    : await db.master.findMany({
        where: { id: { in: [...new Set(rows.map((r) => r.locationId))] } },
        select: { id: true, code: true, name: true },
      });
  if (printing) {
    if (new Set(ids).size !== rows.length)
      return (
        <p role="alert">
          Sebagian identitas tidak ditemukan. Kembali dan pilih ulang label.
        </p>
      );
    await db.audit.create({
      data: {
        actorId,
        action: "LABEL_EXPORTED",
        entityId: "inventory-labels",
        payload: { type, ids: rows.map((r) => r.id) },
      },
    });
  }
  return (
    <>
      <Heading
        title="Label QR"
        description={
          printing
            ? "Periksa identitas, lalu cetak dengan skala 100%. Uji pindai sebelum label ditempel."
            : "Pilih barang atau unit alat, lalu siapkan label yang ingin dicetak."
        }
      />
      {printing ? (
        <>
          <div className="actions no-print">
            <Link href={`/admin/labels?type=${type}`}>Kembali ke pilihan</Link>
            <PrintButton />
          </div>
          <div className="label-sheet">
            {await Promise.all(
              rows.map(async (row) => (
                <article className="asset-label" key={row.id}>
                  <Image
                    src={await QRCode.toDataURL(inventoryQr(type, row.id), {
                      errorCorrectionLevel: "M",
                      margin: 4,
                      width: 240,
                    })}
                    alt={`QR ${row.code}`}
                    width={96}
                    height={96}
                    unoptimized
                  />
                  <div>
                    <strong>{row.code}</strong>
                    <br />
                    {row.name}
                    <br />
                    <small>
                      MTC · {type === "ITEM" ? "Barang / SKU" : "Unit alat"}
                    </small>
                  </div>
                </article>
              )),
            )}
          </div>
        </>
      ) : (
        <>
          <nav className="label-types" aria-label="Jenis label">
            <Link
              href="?type=ASSET"
              aria-current={type === "ASSET" ? "page" : undefined}
            >
              <Wrench size={18} aria-hidden />
              <span>
                Unit alat<small>Satu label untuk setiap alat</small>
              </span>
            </Link>
            <Link
              href="?type=ITEM"
              aria-current={type === "ITEM" ? "page" : undefined}
            >
              <Boxes size={18} aria-hidden />
              <span>
                Barang / SKU<small>Untuk komponen dan wadah barang</small>
              </span>
            </Link>
          </nav>
          <Form action="/admin/labels" className="label-filters">
            <input type="hidden" name="type" value={type} />
            <label>
              <span className="sr-only">Cari kode atau nama</span>
              <Search size={20} aria-hidden />
              <input
                name="q"
                defaultValue={search}
                placeholder="Cari nama barang, kode SKU, atau tag alat…"
              />
            </label>
            <SearchSubmit>Cari label</SearchSubmit>
          </Form>
          <p className="label-results">
            <strong>{total} hasil</strong> ·{" "}
            {total ? (page - 1) * pageSize + 1 : 0}–
            {Math.min(page * pageSize, total)} ditampilkan · Halaman {page} dari{" "}
            {Math.max(1, Math.ceil(total / pageSize))}
          </p>
          <LabelPicker
            key={`${type}/${page}/${search}`}
            rows={rows.map((row) => {
              const location = locations.find((l) => l.id === row.locationId);
              return {
                ...row,
                location: location
                  ? `${location.code} · ${location.name}`
                  : undefined,
              };
            })}
            type={type}
          />
          <nav className="label-pagination" aria-label="Halaman label">
            {page > 1 && (
              <Link
                className="button secondary"
                href={`?${new URLSearchParams({ type, q: search, page: String(page - 1) })}`}
              >
                <ChevronLeft size={18} aria-hidden /> Sebelumnya
              </Link>
            )}
            {page * pageSize < total && (
              <Link
                className="button secondary"
                href={`?${new URLSearchParams({ type, q: search, page: String(page + 1) })}`}
              >
                Berikutnya <ChevronRight size={18} aria-hidden />
              </Link>
            )}
          </nav>
        </>
      )}
    </>
  );
}
