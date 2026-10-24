import Link from "next/link";
import Form from "next/form";
import Image from "next/image";
import QRCode from "qrcode";
import { db } from "@/server/db";
import { inventoryQr } from "@/lib/qr";
import { Heading } from "./data";
import { PrintButton } from "./forms";
import { LabelPicker } from "./label-picker";
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
    Math.max(1, Math.ceil(total / 50)),
  );
  const rows =
    type === "ITEM"
      ? (
          await db.item.findMany({
            where: itemWhere,
            orderBy: { sku: "asc" },
            skip: printing ? 0 : (page - 1) * 50,
            take: printing ? 100 : 50,
          })
        ).map((i) => ({ id: i.id, code: i.sku, name: i.name }))
      : (
          await db.asset.findMany({
            where: assetWhere,
            include: { item: { select: { name: true } } },
            orderBy: { tag: "asc" },
            skip: printing ? 0 : (page - 1) * 50,
            take: printing ? 100 : 50,
          })
        ).map((a) => ({ id: a.id, code: a.tag, name: a.item.name }));
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
        description="QR resmi dibuat oleh aplikasi. Label barang mengenali SKU; label alat mengenali satu unit. Cetak 100% dan uji pindai sebelum ditempel."
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
          <Form action="/admin/labels" className="filters">
            <label>
              Jenis label
              <select name="type" defaultValue={type}>
                <option value="ASSET">Unit alat</option>
                <option value="ITEM">Barang / SKU</option>
              </select>
            </label>
            <label>
              Cari kode atau nama
              <input name="q" defaultValue={search} />
            </label>
            <button type="submit">Cari label</button>
          </Form>
          <p>
            {total} hasil · Halaman {page} dari{" "}
            {Math.max(1, Math.ceil(total / 50))}. Pilihan berlaku untuk halaman
            ini.
          </p>
          <LabelPicker
            key={`${type}/${page}/${search}`}
            rows={rows}
            type={type}
          />
          <nav className="actions" aria-label="Halaman label">
            {page > 1 && (
              <Link
                href={`?${new URLSearchParams({ type, q: search, page: String(page - 1) })}`}
              >
                Sebelumnya
              </Link>
            )}
            {page * 50 < total && (
              <Link
                href={`?${new URLSearchParams({ type, q: search, page: String(page + 1) })}`}
              >
                Berikutnya
              </Link>
            )}
          </nav>
        </>
      )}
    </>
  );
}
