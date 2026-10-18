import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { redirect, notFound } from "next/navigation";
import { db, Prisma } from "@/server/db";
import { getSettings } from "@/server/settings";
import { openingColumns } from "@/server/opening";
import { currentUser, own, permit } from "@/server/policy";
import { Shell } from "@/components/shell";
import {
  ActionForm,
  PrintButton,
  type Field,
  type Option,
  type CatalogItem,
} from "@/components/forms";
import { Login, MfaSetup } from "@/components/auth-client";
import { Scanner } from "@/components/scanner";
import { Badge, Heading, Table, DateLabel } from "@/components/data";

export const dynamic = "force-dynamic";
const names: Record<string, string> = {
  location: "Lokasi",
  type: "Jenis Barang",
  category: "Kategori",
  unit: "Satuan",
  supplier: "Supplier",
  project: "Proyek/Cost Center",
};
const serialize = <T,>(x: T) => JSON.parse(JSON.stringify(x));
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const segments = (await params).path || [];
  const path = "/" + segments.join("/");
  const query = await searchParams;
  const user = await currentUser();
  if (
    ["/login", "/forgot-password", "/reset-password", "/verify-2fa"].includes(
      path,
    )
  )
    return (
      <main id="main" className="login-page">
        <div className="login-panel">
          <section className="login-brand">
            <div>
              <Image src="/logo.jpg" alt="Logo MTC" width={90} height={90} />
              <h2 style={{ marginTop: 24 }}>MTC Inventory</h2>
              <p>PT MEDIA TEKNOLOGI CELEBES</p>
            </div>
            <p>Satu tempat untuk persediaan, aset dan bukti serah terima.</p>
          </section>
          <section className="login-content">
            <h1>{path === "/login" ? "Selamat datang" : "Pemulihan akses"}</h1>
            <p className="muted">
              {path === "/login"
                ? "Masuk dengan akun internal perusahaan."
                : "Hubungi Admin Sistem untuk reset akun. Kanal email pemulihan belum dikonfigurasi; password tidak dikirim melalui chat atau email otomatis."}
            </p>
            {path === "/login" ? (
              <Login />
            ) : (
              <Link href="/login">Kembali ke Login</Link>
            )}
          </section>
        </div>
      </main>
    );
  if (!user) redirect("/login");
  const tech = user.role === "TECHNICIAN";
  const base = tech ? "/me" : "/admin";
  if (/^\/loans\/[^/]+$/.test(path)) redirect(`${base}/loans/${segments[1]}`);
  if (path === "/")
    redirect(
      user.mustChangePassword ? "/profile" : tech ? "/me" : "/admin/dashboard",
    );
  if (user.mustChangePassword && path !== "/profile") redirect("/profile");
  if (
    process.env.APP_MODE === "live" &&
    ["ADMIN", "WAREHOUSE", "AUDITOR"].includes(user.role) &&
    !user.twoFactorEnabled &&
    path !== "/profile"
  )
    redirect("/profile");
  if (tech && path.startsWith("/admin")) notFound();
  if (!tech && path.startsWith("/me")) redirect("/admin/dashboard");
  const page = await content();
  return (
    <Shell actor={user} path={path}>
      {page}
    </Shell>
  );

  async function content() {
    if (!user) return null;
    const canWrite = ["ADMIN", "WAREHOUSE"].includes(user.role);
    if (path === "/admin/imports") {
      permit(user, "users");
      const batches = await db.record.findMany({
        where: { kind: "opening_import" },
        orderBy: { createdAt: "desc" },
        take: 25,
      });
      return (
        <>
          <Heading
            title="Impor Saldo Pembukaan"
            description="Dry run memeriksa setiap baris dan membuat draft penerimaan. Saldo berubah hanya setelah draft ditinjau, direkonsiliasi dengan hitung fisik, lalu diposting."
          />
          <section className="panel">
            <p>Siapkan master/SKU dahulu. Header CSV wajib berurutan:</p>
            <code>{openingColumns.join(",")}</code>
            <p>
              Serialized: satu tag per baris, quantity 1. calibration_required:
              true/false. valid_until: tanggal ISO atau kosong. Pinjaman legacy
              memerlukan rekonsiliasi terpisah; jangan dimasukkan sebagai stok
              tersedia.
            </p>
            <ActionForm
              action="opening-import"
              label="Validasi Dry Run"
              fields={[
                { name: "batchId", label: "Batch ID unik", required: true },
                {
                  name: "reason",
                  label: "Sumber dan dasar rekonsiliasi",
                  required: true,
                },
                {
                  name: "csv",
                  label: "CSV saldo pembukaan (maksimal 100 baris)",
                  type: "textarea",
                  required: true,
                },
              ]}
            />
          </section>
          <section className="panel">
            <h2>Hasil validasi per batch</h2>
            {batches.map((b) => {
              const payload = b.payload as {
                documentId?: string;
                rows: {
                  row: number;
                  values: Record<string, string>;
                  errors: string[];
                }[];
              };
              return (
                <details key={b.id}>
                  <summary>
                    {b.referenceId} ·{" "}
                    {b.status === "validated"
                      ? "Valid, draft siap ditinjau"
                      : "Perlu koreksi"}
                  </summary>
                  {payload.documentId && (
                    <Link href={`/admin/receipts/${payload.documentId}`}>
                      Tinjau Draft & Rekonsiliasi
                    </Link>
                  )}
                  <Table
                    headers={[
                      "Baris",
                      "SKU",
                      "Lokasi",
                      "Jumlah",
                      "Tag",
                      "Hasil",
                    ]}
                    rows={payload.rows.map((r) => [
                      r.row,
                      r.values.sku,
                      r.values.location,
                      r.values.quantity,
                      r.values.tag,
                      r.errors.join("; ") || "Valid",
                    ])}
                  />
                </details>
              );
            })}
          </section>
        </>
      );
    }
    if (path === "/admin/labels") {
      permit(user, "read");
      const assets = await db.asset.findMany({
        where: query.asset ? { id: query.asset } : {},
        include: { item: true },
        take: 100,
        orderBy: { tag: "asc" },
      });
      await db.audit.create({
        data: {
          actorId: user.id,
          action: "LABEL_EXPORTED",
          entityId: "asset-labels",
          payload: { ids: assets.map((a) => a.id) },
        },
      });
      const labels = await Promise.all(
        assets.map(async (a) => ({
          ...a,
          qr: await QRCode.toDataURL(a.tag, {
            errorCorrectionLevel: "M",
            margin: 4,
            width: 240,
          }),
        })),
      );
      return (
        <>
          <Heading
            title="Label Aset"
            description="QR berisi kode aset. Cetak 100%; uji pemindaian pada perangkat dan kertas yang dipakai."
          />
          <PrintButton />
          <div className="label-sheet">
            {labels.map((a) => (
              <article className="asset-label" key={a.id}>
                <Image
                  src={a.qr}
                  alt={`QR ${a.tag}`}
                  width={96}
                  height={96}
                  unoptimized
                />
                <div>
                  <strong>{a.tag}</strong>
                  <br />
                  {a.item.name}
                  <br />
                  <small>{a.serial || a.item.sku}</small>
                </div>
              </article>
            ))}
          </div>
        </>
      );
    }
    const masters = await db.master.findMany({
      orderBy: [{ kind: "asc" }, { name: "asc" }],
    });
    const lookup = (id: string | null | undefined) =>
      masters.find((m) => m.id === id)?.name || id || "—";
    const options = (kind: string): Option[] =>
      serialize(
        masters
          .filter((m) => m.kind === kind && m.active)
          .map((m) => ({ id: m.id, name: m.name, details: m.details })),
      );
    const select = (
      name: string,
      label: string,
      kind: string,
      required = true,
      value?: string,
    ): Field => ({
      name,
      label,
      type: "select",
      options: options(kind),
      required,
      value,
    });
    const items = await db.item.findMany({
      where: {
        ...(tech ? { active: true } : {}),
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: "insensitive" } },
                { sku: { contains: query.q, mode: "insensitive" } },
                {
                  assets: {
                    some: {
                      OR: [
                        { tag: { equals: query.q, mode: "insensitive" } },
                        { serial: { equals: query.q, mode: "insensitive" } },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: { balances: true, assets: true },
      orderBy: { sku: "asc" },
      take: 1000,
    });
    const selectableItems = items.filter(
      (i) =>
        i.active &&
        [i.typeId, i.categoryId, i.unitId].every((id) =>
          masters.some((m) => m.id === id && m.active),
        ),
    );
    const scope = tech ? { actorId: user.id } : {};
    if (path === "/profile")
      return (
        <>
          <Heading
            title="Profil & Keamanan"
            description="Identitas internal, password dan autentikasi dua faktor."
          />
          <section className="panel">
            <h2>{user.name}</h2>
            <p>
              {user.username} · {user.role}
            </p>
            {user.mustChangePassword && (
              <div className="alert warning">
                Ubah password awal sebelum mengakses modul aplikasi.
              </div>
            )}
            <ActionForm
              action="password"
              label="Ubah Password"
              fields={[
                {
                  name: "currentPassword",
                  label: "Password saat ini",
                  type: "password",
                  required: true,
                },
                {
                  name: "newPassword",
                  label: "Password baru (minimal 12 karakter)",
                  type: "password",
                  required: true,
                },
              ]}
            />
          </section>
          <section className="panel">
            <MfaSetup />
          </section>
        </>
      );
    if (path === "/admin/dashboard" || path === "/me") {
      const [pending, loans, low, inspection, overdue] = await Promise.all([
        db.document.count({
          where: { kind: "request", status: "submitted", ...scope },
        }),
        db.loan.findMany({
          where: { status: "active", ...(tech ? { borrowerId: user.id } : {}) },
          include: { lines: true },
          orderBy: { dueAt: "asc" },
          take: 8,
        }),
        db.balance.findMany({ include: { item: true } }),
        db.asset.count({ where: { availability: "pending_inspection" } }),
        db.loan.count({
          where: {
            status: "active",
            dueAt: { lt: new Date() },
            lines: { some: { receivedAt: null } },
            ...(tech ? { borrowerId: user.id } : {}),
          },
        }),
      ]);
      return (
        <>
          <Heading
            title={tech ? "Beranda" : "Dashboard"}
            description={
              tech
                ? `Halo, ${user.name}. Pantau request dan pinjaman Anda.`
                : "Ringkasan pekerjaan gudang dan kondisi inventory."
            }
            href={tech ? "/me/requests/new" : "/admin/receipts/new"}
            action={tech ? "Buat Request" : "Barang Masuk"}
          />
          <div className="stats">
            <Link className="stat" href={tech ? "/me/history" : "/admin/items"}>
              SKU aktif<strong>{items.filter((i) => i.active).length}</strong>
              <small>Katalog barang</small>
            </Link>
            <Link
              className="stat"
              href={base + (tech ? "/history" : "/requests")}
            >
              Request menunggu<strong>{pending}</strong>
              <small>Belum diputuskan</small>
            </Link>
            <Link className="stat" href={base + "/loans?overdue=true"}>
              Overdue
              <strong>{overdue}</strong>
              <small>Belum diterima fisik</small>
            </Link>
            {!tech && (
              <Link className="stat" href="/admin/returns">
                Menunggu inspeksi<strong>{inspection}</strong>
                <small>Unit belum tersedia</small>
              </Link>
            )}
          </div>
          <div className="columns">
            <section className="panel">
              <h2>Pinjaman aktif & jatuh tempo</h2>
              <Table
                headers={["LOAN", "Rencana kembali", "Belum kembali"]}
                rows={loans.map((l) => [
                  <Link key={l.id} href={`${base}/loans/${l.id}`}>
                    {l.number}
                  </Link>,
                  <DateLabel key="date" value={l.dueAt} />,
                  l.lines.filter((x) => !x.receivedAt).length,
                ])}
              />
            </section>
            <section className="panel">
              <h2>{tech ? "Tindakan berikutnya" : "Stok menipis"}</h2>
              {tech ? (
                <div className="actions">
                  <Link href="/me/pickups" className="button">
                    Ambil Barang Disetujui
                  </Link>
                  <Link href="/me/loans" className="secondary button">
                    Ajukan Pengembalian
                  </Link>
                  <Link href="/me/consumable-returns/new">
                    Pengembalian Sisa
                  </Link>
                </div>
              ) : (
                <Table
                  headers={["Barang", "Tersedia", "Satuan"]}
                  rows={low
                    .filter((b) =>
                      b.onHand.sub(b.reserved).lte(b.item.minStock),
                    )
                    .slice(0, 8)
                    .map((b) => [
                      b.item.name,
                      b.onHand.sub(b.reserved).toString(),
                      lookup(b.item.unitId),
                    ])}
                />
              )}
            </section>
          </div>
          {!tech && (
            <section className="panel">
              <h2>Mulai dari setup yang lengkap</h2>
              <p>
                Siapkan lokasi, jenis, kategori, satuan dan katalog foto sebelum
                mencatat penerimaan.
              </p>
              <Link href="/admin/masters">Buka Master Data</Link>
            </section>
          )}
        </>
      );
    }
    if (path === "/admin/masters") {
      permit(user, "read");
      const kind = Object.keys(names).includes(query.tab || "")
        ? query.tab!
        : "location";
      const edit = query.edit
        ? masters.find((m) => m.id === query.edit && m.kind === kind)
        : null;
      const detail = (edit?.details || {}) as Record<string, unknown>;
      const locationPath = (row: (typeof masters)[number]): string => {
        const parts = [row.name];
        const visited = new Set([row.id]);
        let parent = masters.find((m) => m.id === row.parentId);
        while (parent && !visited.has(parent.id)) {
          parts.unshift(parent.name);
          visited.add(parent.id);
          parent = masters.find((m) => m.id === parent?.parentId);
        }
        return parts.join(" / ");
      };
      const filtered = masters.filter(
        (m) =>
          m.kind === kind &&
          (!query.q ||
            `${m.code} ${locationPath(m)}`
              .toLowerCase()
              .includes(query.q.toLowerCase())) &&
          (!query.active || m.active === (query.active === "yes")) &&
          (!query.parent || m.parentId === query.parent),
      );
      const pageNumber = Math.max(
        1,
        Math.min(Math.ceil(filtered.length / 25) || 1, Number(query.page) || 1),
      );
      const masterFields: Field[] = [
        { name: "code", label: "Kode", required: true, value: edit?.code },
        { name: "name", label: "Nama", required: true, value: edit?.name },
        {
          name: "details.description",
          label: "Keterangan",
          type: "textarea",
          value: String(detail.description || ""),
        },
        {
          name: "active",
          label: "Aktif",
          type: "checkbox",
          value: edit?.active ?? true,
        },
      ];
      if (kind === "location")
        masterFields.push(
          select(
            "parentId",
            "Lokasi induk",
            "location",
            false,
            edit?.parentId || "",
          ),
          {
            name: "details.locationType",
            label: "Tipe lokasi",
            type: "select",
            value: String(detail.locationType || ""),
            options: [
              "Gudang",
              "Blok",
              "Rak",
              "Level",
              "Box",
              "Lokasi Penggunaan",
            ].map((v) => ({ id: v, name: v })),
            required: true,
          },
        );
      if (kind === "unit")
        masterFields.push({
          name: "details.fractional",
          label: "Menerima jumlah pecahan",
          type: "checkbox",
          value: !!detail.fractional,
        });
      if (kind === "category")
        masterFields.push(
          select(
            "details.defaultTypeId",
            "Default jenis",
            "type",
            false,
            String(detail.defaultTypeId || ""),
          ),
          select(
            "details.defaultUnitId",
            "Default satuan",
            "unit",
            false,
            String(detail.defaultUnitId || ""),
          ),
          select(
            "details.defaultLocationId",
            "Default lokasi",
            "location",
            false,
            String(detail.defaultLocationId || ""),
          ),
          {
            name: "details.photoId",
            label: "Foto ilustrasi kategori",
            type: "photo",
            value: String(detail.photoId || ""),
          },
        );
      return (
        <>
          <Heading
            title="Master Data"
            description="Siapkan referensi dan default agar penambahan inventory lebih sederhana."
          />
          <div className="alert">
            Urutan setup: Lokasi · Jenis · Satuan · Kategori · Katalog & Foto ·
            Penerimaan.
          </div>
          {user.role === "ADMIN" && (
            <p>
              <Link href="/admin/imports">
                Impor saldo pembukaan dengan dry run
              </Link>
            </p>
          )}
          <nav className="tabs" aria-label="Jenis master">
            {Object.entries(names).map(([key, name]) => (
              <Link
                aria-current={kind === key ? "page" : undefined}
                key={key}
                href={`/admin/masters?tab=${key}`}
              >
                {name}
              </Link>
            ))}
            <Link href="/admin/items">Katalog & Foto</Link>
          </nav>
          <section className="panel">
            <h2>{names[kind]}</h2>
            <form className="form-grid" method="get">
              <input type="hidden" name="tab" value={kind} />
              <label>
                Cari kode/nama
                <input name="q" defaultValue={query.q} />
              </label>
              <label>
                Status
                <select name="active" defaultValue={query.active || ""}>
                  <option value="">Semua</option>
                  <option value="yes">Aktif</option>
                  <option value="no">Nonaktif</option>
                </select>
              </label>
              {kind === "location" && (
                <label>
                  Lokasi induk
                  <select name="parent" defaultValue={query.parent || ""}>
                    <option value="">Semua tingkatan</option>
                    {masters
                      .filter((m) => m.kind === "location")
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {locationPath(m)}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <button type="submit">Terapkan Filter</button>
            </form>
            <Table
              headers={["Kode", "Nama", "Induk/Default", "Status", "Aksi"]}
              rows={filtered
                .slice((pageNumber - 1) * 25, pageNumber * 25)
                .map((m) => [
                  m.code,
                  kind === "location" ? locationPath(m) : m.name,
                  m.parentId
                    ? lookup(m.parentId)
                    : kind === "category"
                      ? ["defaultTypeId", "defaultUnitId", "defaultLocationId"]
                          .map((key) =>
                            lookup((m.details as Record<string, string>)[key]),
                          )
                          .join(" · ")
                      : "—",
                  <Badge
                    key="active"
                    value={m.active ? "active" : "cancelled"}
                  />,
                  canWrite ? (
                    <Link
                      key={m.id}
                      href={`/admin/masters?tab=${kind}&edit=${m.id}`}
                    >
                      Edit
                    </Link>
                  ) : (
                    "Baca saja"
                  ),
                ])}
            />
            <nav className="actions" aria-label="Halaman hasil master">
              <span>
                {filtered.length} hasil · Halaman {pageNumber}
              </span>
              {pageNumber > 1 && (
                <Link
                  href={`?${new URLSearchParams({ tab: kind, q: query.q || "", active: query.active || "", parent: query.parent || "", page: String(pageNumber - 1) })}`}
                >
                  Sebelumnya
                </Link>
              )}
              {pageNumber * 25 < filtered.length && (
                <Link
                  href={`?${new URLSearchParams({ tab: kind, q: query.q || "", active: query.active || "", parent: query.parent || "", page: String(pageNumber + 1) })}`}
                >
                  Berikutnya
                </Link>
              )}
            </nav>
          </section>
          {canWrite && (kind !== "type" || edit) && (
            <section className="panel">
              <h2>
                {edit ? "Edit" : "Tambah"} {names[kind]}
              </h2>
              <ActionForm
                key={edit?.id || kind}
                action="master"
                base={{
                  kind,
                  ...(edit ? { id: edit.id, version: edit.version } : {}),
                  ...(kind === "type" ? { details: detail } : {}),
                }}
                fields={masterFields}
              />
            </section>
          )}
          {kind === "type" && (
            <p className="muted">
              Kode dan tracking jenis sistem dijaga tetap; perubahan label/aktif
              tersedia melalui Edit.
            </p>
          )}
        </>
      );
    }
    if (
      ["/admin/items/new"].includes(path) ||
      /^\/admin\/items\/[^/]+\/edit$/.test(path)
    ) {
      permit(user, "master");
      const item =
        segments[2] !== "new"
          ? await db.item.findUnique({ where: { id: segments[2] } })
          : null;
      return (
        <>
          <Heading
            title={item ? "Edit Barang" : "Tambah Katalog Barang"}
            description="Pilih kategori untuk memakai default. Menyimpan katalog tidak menambah stok."
          />
          <section className="panel">
            <ActionForm
              action="item"
              defaults={options("category")}
              base={
                item ? serialize({ id: item.id, version: item.version }) : {}
              }
              fields={[
                {
                  name: "sku",
                  label: "Kode SKU",
                  required: true,
                  value: item?.sku,
                },
                {
                  name: "name",
                  label: "Nama barang",
                  required: true,
                  value: item?.name,
                },
                select(
                  "categoryId",
                  "Kategori",
                  "category",
                  true,
                  item?.categoryId,
                ),
                select("typeId", "Jenis barang", "type", true, item?.typeId),
                select("unitId", "Satuan dasar", "unit", true, item?.unitId),
                select(
                  "locationId",
                  "Lokasi default",
                  "location",
                  true,
                  item?.locationId,
                ),
                {
                  name: "minStock",
                  label: "Minimum stock",
                  type: "number",
                  value: item?.minStock.toString() || "0",
                  required: true,
                },
                {
                  name: "photoId",
                  label: "Foto utama",
                  type: "photo",
                  value: item?.photoId || "",
                },
                {
                  name: "description",
                  label: "Spesifikasi/kelengkapan",
                  type: "textarea",
                  value: item?.description,
                },
                {
                  name: "active",
                  label: "Aktif",
                  type: "checkbox",
                  value: item?.active ?? true,
                },
              ]}
            />
          </section>
        </>
      );
    }
    if (path === "/admin/items" || path === "/me/items") {
      const page = Math.max(1, Number(query.page) || 1);
      const filtered = items.slice((page - 1) * 25, page * 25);
      return (
        <>
          <Heading
            title={tech ? "Cari Barang" : "Inventory & Katalog"}
            description="Katalog, foto, saldo quantity dan identitas unit aset."
            href={canWrite ? "/admin/items/new" : undefined}
            action="Tambah Barang"
          />
          <form className="toolbar">
            <label>
              Cari nama/kode
              <input
                name="q"
                defaultValue={query.q}
                placeholder="Contoh: multimeter"
              />
            </label>
            <button>Cari</button>
            <Link href={path}>Hapus Filter</Link>
          </form>
          <Table
            headers={[
              "Foto",
              "Kode / Nama",
              "Jenis",
              "Lokasi",
              "Tersedia",
              "Aksi",
            ]}
            rows={filtered.map((i) => [
              i.photoId ? (
                <Image
                  unoptimized
                  width={64}
                  height={64}
                  key="photo"
                  className="thumbnail"
                  alt={i.name}
                  src={`/api/files/${i.photoId}`}
                />
              ) : (
                "Belum ada foto"
              ),
              <span key="name">
                <strong>{i.sku}</strong>
                <br />
                {i.name}
              </span>,
              lookup(i.typeId),
              lookup(i.locationId),
              i.tracking === "quantity"
                ? `${i.balances.reduce((n, b) => n.add(b.onHand.sub(b.reserved)), new Prisma.Decimal(0)).toString()} ${lookup(i.unitId)}`
                : `${i.assets.filter((a) => a.availability === "available").length} unit`,
              <Link key={i.id} href={`${base}/items/${i.id}`}>
                Lihat
              </Link>,
            ])}
          />
          <div className="pagination">
            {page > 1 && (
              <Link
                href={`${path}?q=${encodeURIComponent(query.q || "")}&page=${page - 1}`}
              >
                Sebelumnya
              </Link>
            )}
            Halaman {page}
            {items.length > page * 25 && (
              <Link
                href={`${path}?q=${encodeURIComponent(query.q || "")}&page=${page + 1}`}
              >
                Berikutnya
              </Link>
            )}
          </div>
        </>
      );
    }
    if (/^\/(admin|me)\/items\/[^/]+$/.test(path)) {
      const item = await db.item.findUnique({
        where: { id: segments[2] },
        include: { balances: true, assets: true },
      });
      if (!item) notFound();
      return (
        <>
          <Heading
            title={item.name}
            description={`${item.sku} · ${lookup(item.typeId)} · ${lookup(item.categoryId)}`}
            href={
              canWrite ? `/admin/items/${item.id}/edit` : "/me/requests/new"
            }
            action={canWrite ? "Edit Katalog" : "Buat Request"}
          />
          <section className="panel">
            {item.photoId && (
              <Image
                unoptimized
                src={`/api/files/${item.photoId}`}
                alt={item.name}
                width={160}
                height={160}
                style={{ objectFit: "contain" }}
              />
            )}
            <p>{item.description || "Belum ada spesifikasi tambahan."}</p>
            <dl className="data-list">
              <dt>Satuan</dt>
              <dd>{lookup(item.unitId)}</dd>
              <dt>Lokasi default</dt>
              <dd>{lookup(item.locationId)}</dd>
              <dt>Tracking</dt>
              <dd>{item.tracking}</dd>
            </dl>
          </section>
          {item.tracking === "quantity" ? (
            <Table
              headers={["Lokasi", "Fisik layak", "Direservasi", "Tersedia"]}
              rows={item.balances.map((b) => [
                lookup(b.locationId),
                b.onHand.toString(),
                b.reserved.toString(),
                b.onHand.sub(b.reserved).toString(),
              ])}
            />
          ) : (
            <Table
              headers={[
                "Tag / Serial",
                "Kondisi",
                "Teknis",
                "Ketersediaan",
                "Kalibrasi",
                "Label",
              ]}
              rows={item.assets.map((a) => [
                a.tag + " / " + (a.serial || "—"),
                a.condition,
                a.technical,
                <Badge key="status" value={a.availability} />,
                <DateLabel key="cal" value={a.validUntil} />,
                !tech ? (
                  <Link key="label" href={`/admin/labels?asset=${a.id}`}>
                    Cetak QR
                  </Link>
                ) : (
                  "Hubungi gudang"
                ),
              ])}
            />
          )}
        </>
      );
    }
    if (path === "/admin/receipts/new" || path === "/me/requests/new") {
      const revision =
        tech && query.revise
          ? await db.document.findUnique({
              where: { id: query.revise },
              include: { lines: true },
            })
          : null;
      if (
        query.revise &&
        (!revision ||
          revision.actorId !== user.id ||
          revision.kind !== "request" ||
          !["submitted", "approved"].includes(revision.status))
      )
        notFound();

      if (path.startsWith("/admin")) permit(user, "stock");
      return (
        <>
          <Heading
            title={
              revision
                ? "Revisi " + revision.number
                : tech
                  ? "Request Barang"
                  : "Barang Masuk"
            }
            description={
              tech
                ? "Consumable dan alat harus dipisah dalam request. Approval belum mengeluarkan stok."
                : "Pilih SKU yang telah disiapkan. Simpan draft, lalu tinjau dan posting penerimaan."
            }
          />
          <section className="panel">
            {!selectableItems.length ? (
              <>
                <p>
                  Belum ada katalog barang. Siapkan master dan SKU terlebih
                  dahulu.
                </p>
                <Link href="/admin/masters">Buka Master Data</Link>
              </>
            ) : (
              <ActionForm
                action={
                  revision ? "revise-request" : tech ? "request" : "receipt"
                }
                base={revision ? { id: revision.id } : {}}
                initialLines={revision?.lines.map((l) => ({
                  itemId: l.itemId,
                  locationId: l.locationId,
                  quantity: l.quantity.toString(),
                }))}
                label={tech ? "Kirim Request" : "Simpan Draft"}
                items={
                  serialize(
                    selectableItems.map((i) => ({
                      id: i.id,
                      name: i.name,
                      sku: i.sku,
                      tracking: i.tracking,
                      unitId: i.unitId,
                      locationId: i.locationId,
                      photoId: i.photoId,
                      unitName: lookup(i.unitId),
                      categoryName: lookup(i.categoryId),
                      specifications: i.description,
                    })),
                  ) as CatalogItem[]
                }
                locations={options("location")}
                fields={[
                  select(
                    "projectId",
                    tech ? "Proyek/Cost Center" : "Proyek (opsional)",
                    "project",
                    tech,
                    revision?.projectId || "",
                  ),
                  ...(tech
                    ? [
                        select(
                          "targetLocationId",
                          "Lokasi penggunaan",
                          "location",
                          false,
                        ),
                      ]
                    : []),
                  {
                    name: "purpose",
                    label: tech
                      ? "Tujuan penggunaan"
                      : "Sumber/supplier dan keterangan penerimaan",
                    type: "textarea",
                    required: true,
                    value: revision?.purpose || "",
                  },
                  { name: "reference", label: "Referensi" },
                  ...(tech
                    ? [
                        {
                          name: "dueAt",
                          label: "Rencana kembali (wajib untuk alat)",
                          type: "datetime-local",
                        } as Field,
                      ]
                    : []),
                ]}
              />
            )}
          </section>
        </>
      );
    }
    if (
      [
        "/admin/receipts",
        "/admin/requests",
        "/me/pickups",
        "/me/history",
      ].includes(path)
    ) {
      const docs = await db.document.findMany({
        where: {
          ...scope,
          ...(path === "/admin/receipts"
            ? { kind: "receipt" }
            : path === "/me/pickups"
              ? { kind: "request", status: "approved" }
              : path === "/me/history"
                ? {}
                : { kind: "request" }),
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return (
        <>
          <Heading
            title={
              path === "/admin/receipts"
                ? "Barang Masuk"
                : path === "/me/pickups"
                  ? "Ambil Barang"
                  : path === "/me/history"
                    ? "Riwayat Anda"
                    : "Persetujuan Request"
            }
            description="Buka transaksi untuk melihat detail dan tindakan yang tersedia."
            href={
              path === "/admin/receipts" ? "/admin/receipts/new" : undefined
            }
            action="Tambah Penerimaan"
          />
          {path === "/me/pickups" && <Scanner />}
          <Table
            headers={["Nomor", "Jenis", "Tanggal", "Status", "Aksi"]}
            rows={docs.map((d) => [
              d.number,
              d.kind,
              <DateLabel key="date" value={d.createdAt} />,
              <Badge key="state" value={d.status} />,
              <Link
                key={d.id}
                href={`${tech ? "/me/requests" : d.kind === "receipt" ? "/admin/receipts" : "/admin/requests"}/${d.id}`}
              >
                Lihat
              </Link>,
            ])}
          />
        </>
      );
    }
    if (
      /^\/(admin\/(receipts|requests|issues)|me\/requests)\/[^/]+$/.test(path)
    ) {
      const doc = await db.document.findUnique({
        where: { id: segments[2] },
        include: { lines: true },
      });
      if (!doc) notFound();
      own(user, doc.actorId);
      const assets = await db.asset.findMany({ where: { requestId: doc.id } });
      const itemName = (i: string) => items.find((x) => x.id === i)?.name || i;
      return (
        <>
          <Heading
            title={doc.number}
            description={`${doc.purpose} · ${lookup(doc.projectId)}`}
          />
          <section className="panel">
            <Badge value={doc.status} />
            <dl className="data-list">
              <dt>Waktu</dt>
              <dd>
                <DateLabel value={doc.createdAt} />
              </dd>
              <dt>Rencana kembali</dt>
              <dd>
                <DateLabel value={doc.dueAt} />
              </dd>
              <dt>Alasan keputusan</dt>
              <dd>{doc.reason || "—"}</dd>
            </dl>
            <Table
              headers={[
                "Barang",
                "Lokasi",
                "Diminta",
                "Disetujui",
                "Diserahkan",
                "Kembali",
                "Waste",
              ]}
              rows={doc.lines.map((l) => [
                itemName(l.itemId),
                lookup(l.locationId),
                l.quantity.toString(),
                l.approved.toString(),
                l.fulfilled.toString(),
                l.returned.toString(),
                l.waste.toString(),
              ])}
            />
          </section>
          {doc.kind === "receipt" && doc.status === "draft" && canWrite && (
            <section className="panel">
              <h2>Tinjau posting</h2>
              <p>
                Posting akan menambah stok fisik atau membuat unit unik.
                Pastikan jumlah, lokasi dan identitas unit sesuai penerimaan.
              </p>
              <ActionForm
                action="post-receipt"
                label="Posting Penerimaan"
                base={{ id: doc.id }}
              />
            </section>
          )}
          {doc.kind === "request" &&
            doc.status === "submitted" &&
            user.role === "WAREHOUSE" &&
            doc.actorId !== user.id && (
              <div className="columns">
                <section className="panel">
                  <h2>Persetujuan</h2>
                  <p>Persetujuan hanya mereservasi barang.</p>
                  <ActionForm
                    action="approve"
                    label="Setujui Request"
                    base={{ id: doc.id }}
                    fields={[
                      ...doc.lines.map(
                        (l) =>
                          ({
                            name: `approved.${l.id}`,
                            label: `Jumlah disetujui: ${itemName(l.itemId)}`,
                            type: "number",
                            value: l.quantity.toString(),
                            required: true,
                          }) as Field,
                      ),
                      {
                        name: "reason",
                        label: "Alasan (wajib bila jumlah berubah)",
                        type: "textarea",
                      },
                    ]}
                  />
                </section>
                <section className="panel">
                  <h2>Tolak Request</h2>
                  <ActionForm
                    action="reject"
                    label="Tolak Request"
                    base={{ id: doc.id }}
                    fields={[
                      {
                        name: "reason",
                        label: "Alasan penolakan",
                        type: "textarea",
                        required: true,
                      },
                    ]}
                  />
                </section>
              </div>
            )}
          {doc.status === "approved" &&
            doc.actorId === user.id &&
            !doc.acknowledgedAt && (
              <section className="panel">
                <h2>Konfirmasi penerima</h2>
                <p>
                  Saya telah meninjau barang/unit dan kondisi awal bersama
                  petugas. Posting penyerahan tetap dilakukan petugas gudang.
                </p>
                <ActionForm
                  action="acknowledge"
                  label="Konfirmasi Penerimaan"
                  base={{ id: doc.id }}
                />
              </section>
            )}
          {doc.status === "submitted" &&
            user.role === "ADMIN" &&
            user.emergencyIssue &&
            doc.actorId !== user.id &&
            doc.lines.every(
              (l) =>
                items.find((i) => i.id === l.itemId)?.tracking === "quantity",
            ) && (
              <section className="panel">
                <h2>Pengeluaran Darurat</h2>
                <p>
                  Override persetujuan normal. Penerima tetap wajib mengakui dan
                  petugas tetap memposting issue; keputusan masuk daftar review.
                </p>
                <ActionForm
                  action="emergency-approve"
                  label="Catat Override & Reservasi"
                  base={{ id: doc.id }}
                  fields={[
                    {
                      name: "reason",
                      label: "Alasan darurat dan dasar kewenangan",
                      type: "textarea",
                      required: true,
                    },
                  ]}
                />
              </section>
            )}
          {doc.actorId === user.id &&
            tech &&
            ["submitted", "approved"].includes(doc.status) && (
              <section className="panel">
                <h2>Perubahan Request</h2>
                <p>
                  Revisi melepas reservasi lama dan meminta persetujuan baru.
                  Riwayat awal tetap tersimpan.
                </p>
                <Link href={`/me/requests/new?revise=${doc.id}`}>
                  Buat Revisi Request
                </Link>
                <ActionForm
                  action="cancel"
                  label="Batalkan Request"
                  base={{ id: doc.id }}
                  fields={[
                    {
                      name: "reason",
                      label: "Alasan pembatalan",
                      required: true,
                    },
                  ]}
                />
              </section>
            )}
          {doc.status === "approved" && canWrite && (
            <section className="panel">
              <h2>Posting serah terima</h2>
              <p>
                Memerlukan konfirmasi pemohon, reservasi aktif, pemeriksaan
                kondisi dan kalibrasi saat ini.
              </p>
              <ActionForm
                action={
                  items.find((i) => i.id === doc.lines[0]?.itemId)?.tracking ===
                  "serialized"
                    ? "checkout"
                    : "issue"
                }
                label="Posting Penyerahan"
                base={{ id: doc.id }}
                fields={assets
                  .filter(
                    (a) =>
                      a.requestId === doc.id && a.availability === "reserved",
                  )
                  .flatMap((a) => [
                    {
                      name: `conditions.${a.id}`,
                      label: `${a.tag}: kondisi saat serah`,
                      type: "select" as const,
                      options: ["Baru", "Baik"].map((v) => ({
                        id: v,
                        name: v,
                      })),
                      required: true,
                    },
                    {
                      name: `completeness.${a.id}`,
                      label: `${a.tag}: kelengkapan terverifikasi`,
                      required: true,
                      help: "Catat komponen/aksesori yang ikut diserahkan.",
                    },
                  ])}
              />
            </section>
          )}
          {doc.status === "fulfilled" &&
            doc.lines.some((l) => l.fulfilled.gt(0)) && (
              <section className="panel">
                <h2>Pengembalian sisa / waste consumable</h2>
                {doc.lines
                  .filter(
                    (l) =>
                      items.find((i) => i.id === l.itemId)?.tracking ===
                      "quantity",
                  )
                  .map((l) => (
                    <ActionForm
                      key={l.id}
                      action="consumable-return"
                      label={
                        canWrite
                          ? "Terima Sisa Layak"
                          : "Ajukan Pengembalian Sisa"
                      }
                      base={{ lineId: l.id, receive: canWrite }}
                      fields={[
                        {
                          name: "quantity",
                          label: `Sisa layak: ${itemName(l.itemId)}`,
                          type: "number",
                          required: true,
                        },
                        { name: "reason", label: "Keterangan", required: true },
                      ]}
                    />
                  ))}
              </section>
            )}
        </>
      );
    }
    if (
      path === "/admin/loans" ||
      path === "/admin/returns" ||
      path === "/me/loans"
    ) {
      const loans = await db.loan.findMany({
        where: {
          ...(tech ? { borrowerId: user.id } : {}),
          ...(query.overdue
            ? { status: "active", dueAt: { lt: new Date() } }
            : {}),
        },
        include: { lines: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return (
        <>
          <Heading
            title={
              path === "/admin/returns"
                ? "Penerimaan & Pemeriksaan"
                : "Pinjaman"
            }
            description="Satu LOAN, pengembalian bertahap, dan pemeriksaan per unit."
          />
          <Table
            headers={[
              "LOAN",
              "Jatuh tempo",
              "Belum kembali",
              "Menunggu periksa",
              "Status",
              "Aksi",
            ]}
            rows={loans.map((l) => [
              l.number,
              <DateLabel key="date" value={l.dueAt} />,
              l.lines.filter((x) => !x.receivedAt).length,
              l.lines.filter((x) => x.receivedAt && !x.inspectedAt).length,
              <Badge key="status" value={l.status} />,
              <Link key={l.id} href={`${base}/loans/${l.id}`}>
                Lihat
              </Link>,
            ])}
          />
        </>
      );
    }
    if (/^\/(admin\/(loans|returns)|me\/loans)\/[^/]+$/.test(path)) {
      const loan = await db.loan.findUnique({
        where: { id: segments[2] },
        include: {
          lines: true,
          events: { orderBy: { createdAt: "asc" } },
          versions: { orderBy: { version: "desc" } },
        },
      });
      if (!loan) notFound();
      own(user, loan.borrowerId);
      const eventActors = await db.user.findMany({
        where: { id: { in: loan.events.map((e) => e.actorId) } },
        select: { id: true, name: true },
      });
      const eventNames: Record<string, string> = {
        checkout: "Serah terima",
        "request-return": "Pengajuan kembali",
        "receive-return": "Terima fisik",
        inspect: "Pemeriksaan",
        "correct-loan": "Koreksi",
        "close-exception": "Penutupan pengecualian",
      };
      const assets = await db.asset.findMany({
        where: { id: { in: loan.lines.map((l) => l.assetId) } },
      });
      const outstanding = loan.lines.filter((l) => !l.receivedAt).length;
      const pending = loan.lines.filter(
        (l) => l.receivedAt && !l.inspectedAt,
      ).length;
      return (
        <>
          <Heading
            title={loan.number}
            description="Bukti awal dipertahankan. Penerimaan fisik dan inspeksi adalah dua tahap terpisah."
          />
          <div className="stats">
            {[
              ["Diserahkan", loan.lines.length],
              ["Belum Kembali", outstanding],
              ["Menunggu Pemeriksaan", pending],
            ].map(([label, n]) => (
              <div className="stat" key={label}>
                {label}
                <strong>{n}</strong>
              </div>
            ))}
          </div>
          <section className="panel">
            <div className="actions">
              <Badge value={loan.status} />
              {outstanding > 0 && outstanding < loan.lines.length && (
                <span className="badge">Dikembalikan Sebagian</span>
              )}
              {pending > 0 && <Badge value="pending_inspection" />}
              {outstanding > 0 && loan.dueAt < new Date() && (
                <span className="badge danger">Overdue</span>
              )}
            </div>
            <p>
              Rencana kembali: <DateLabel value={loan.dueAt} />
            </p>
            <Table
              headers={[
                "Tag",
                "Kondisi",
                "Diterima fisik",
                "Diperiksa",
                "Ketersediaan",
              ]}
              rows={loan.lines.map((l) => {
                const a = assets.find((a) => a.id === l.assetId);
                return [
                  a?.tag,
                  a?.condition,
                  <DateLabel key="received" value={l.receivedAt} />,
                  <DateLabel key="inspected" value={l.inspectedAt} />,
                  <Badge key="state" value={a?.availability || ""} />,
                ];
              })}
            />
          </section>
          {loan.status === "active" && (tech || canWrite) && (
            <section className="panel">
              <h2>{tech ? "Ajukan Kembali" : "Terima Fisik / Inspeksi"}</h2>
              {loan.lines
                .filter((l) => (tech ? !l.receivedAt : !l.inspectedAt))
                .map((l) => (
                  <details key={l.id}>
                    <summary>
                      {assets.find((a) => a.id === l.assetId)?.tag} —{" "}
                      {l.receivedAt
                        ? "Simpan hasil pemeriksaan"
                        : "Pengembalian"}
                    </summary>
                    <ActionForm
                      action={
                        tech
                          ? "request-return"
                          : l.receivedAt
                            ? "inspect"
                            : "receive-return"
                      }
                      label={
                        tech
                          ? "Ajukan Pengembalian"
                          : l.receivedAt
                            ? "Simpan Hasil Pemeriksaan"
                            : "Terima Fisik"
                      }
                      base={{ id: loan.id, assetIds: [l.assetId] }}
                      fields={[
                        {
                          name: "condition",
                          label: "Kondisi aktual",
                          type: "select",
                          options: [
                            "Baik",
                            "Rusak Ringan",
                            "Rusak Berat",
                            "Perlu Kalibrasi",
                          ].map((v) => ({ id: v, name: v })),
                          value: "Baik",
                          required: true,
                        },
                        {
                          name: "reason",
                          label: "Kondisi, kelengkapan dan catatan",
                          type: "textarea",
                        },
                        {
                          name: "photoId",
                          label: "Foto masalah (wajib bila bermasalah)",
                          type: "photo",
                        },
                      ]}
                    />
                  </details>
                ))}
            </section>
          )}
          <section className="panel">
            <h2>Bukti dan versi</h2>
            <Table
              headers={["Versi", "Tanggal", "Status", "Arsip"]}
              rows={loan.versions.map((v) => [
                v.version,
                <DateLabel key="date" value={v.createdAt} />,
                <Badge key="status" value={v.status} />,
                v.status === "ready" ? (
                  <a key="file" href={`/api/documents/${v.id}`}>
                    Unduh PDF {v.version === 1 ? "Awal" : "Versi " + v.version}
                  </a>
                ) : v.status === "failed" ? (
                  <div key="retry">
                    <p>Bukti gagal dibuat. Transaksi tetap tercatat.</p>
                    {canWrite && (
                      <ActionForm
                        action="retry-pdf"
                        label="Ulangi Pembuatan PDF"
                        base={{ id: v.id }}
                      />
                    )}
                  </div>
                ) : (
                  "Bukti sedang diproses; checkout tetap sah."
                ),
              ])}
            />
          </section>
          <section className="panel">
            <h2>Riwayat kejadian</h2>
            <Table
              headers={["Waktu", "Kejadian", "Aktor"]}
              rows={loan.events.map((e) => [
                <DateLabel key="date" value={e.createdAt} />,
                eventNames[e.type] || e.type,
                eventActors.find((a) => a.id === e.actorId)?.name || e.actorId,
              ])}
            />
          </section>
          {canWrite && (
            <section className="panel">
              <h2>Koreksi historis beralasan</h2>
              <ActionForm
                action="correct-loan"
                label="Catat Koreksi & Versi Baru"
                base={{ id: loan.id }}
                fields={[
                  {
                    name: "reason",
                    label: "Alasan dan uraian koreksi",
                    type: "textarea",
                    required: true,
                  },
                ]}
              />
            </section>
          )}
        </>
      );
    }
    const transferAssets =
      path === "/admin/transfers"
        ? await db.asset.findMany({
            where: { availability: { in: ["available", "blocked"] } },
            orderBy: { tag: "asc" },
          })
        : [];
    if (path === "/admin/transfers")
      return (
        <>
          <Heading
            title="Transfer Lokasi"
            description="Asal dan tujuan dicatat atomik; total barang perusahaan tetap."
          />
          <section className="panel">
            <ActionForm
              action="transfer"
              fields={[
                {
                  name: "itemId",
                  label: "Barang",
                  type: "select",
                  options: items.map((i) => ({
                    id: i.id,
                    name: i.sku + " — " + i.name,
                  })),
                  required: true,
                },
                select("sourceId", "Lokasi asal", "location"),
                select("targetId", "Lokasi tujuan", "location"),
                {
                  name: "assetIds",
                  label: "Unit serialized (kosong untuk consumable)",
                  type: "multiselect",
                  options: transferAssets.map((a) => ({
                    id: a.id,
                    name: a.tag + " / " + lookup(a.locationId),
                  })),
                  help: "Pilih unit yang sesuai barang dan lokasi asal. Jumlah harus sama dengan banyaknya unit.",
                },
                {
                  name: "quantity",
                  label: "Jumlah",
                  type: "number",
                  required: true,
                },
                {
                  name: "reason",
                  label: "Alasan/referensi",
                  type: "textarea",
                  required: true,
                },
              ]}
            />
          </section>
        </>
      );
    if (path === "/admin/stocktakes") {
      const docs = await db.document.findMany({
        where: { kind: "stocktake" },
        orderBy: { createdAt: "desc" },
      });
      return (
        <>
          <Heading
            title="Stock Opname"
            description="Lokasi dibekukan selama hitung dan review; adjustment bukan edit saldo."
          />
          <section className="panel">
            <ActionForm
              action="stocktake"
              label="Mulai Sesi & Bekukan Lokasi"
              fields={[
                select("locationId", "Lokasi", "location"),
                {
                  name: "reason",
                  label: "Tujuan/periode hitung",
                  required: true,
                },
              ]}
            />
          </section>
          <Table
            headers={["Sesi", "Lokasi", "Status", "Detail"]}
            rows={docs.map((d) => [
              d.number,
              lookup(d.locationId),
              <Badge key="state" value={d.status} />,
              <Link key={d.id} href={`/admin/stocktakes/${d.id}`}>
                Buka
              </Link>,
            ])}
          />
        </>
      );
    }
    if (/^\/admin\/stocktakes\/[^/]+$/.test(path)) {
      const d = await db.document.findUnique({
        where: { id: segments[2] },
        include: { lines: true },
      });
      if (!d || d.kind !== "stocktake") notFound();
      return (
        <>
          <Heading
            title={d.number}
            description={`Lokasi: ${lookup(d.locationId)}. Reviewer berbeda dari pembuat sesi.`}
          />
          <Badge value={d.status} />
          <section className="panel">
            <Table
              headers={["Barang", "Saldo snapshot", "Hasil hitung"]}
              rows={d.lines.map((l) => [
                (items.find((i) => i.id === l.itemId)?.name || l.itemId) +
                  ((l.details as { tag?: string }).tag
                    ? " · " + (l.details as { tag: string }).tag
                    : ""),
                l.quantity.toString(),
                String(
                  (l.details as { count?: string }).count || "Belum dihitung",
                ),
              ])}
            />
            {d.status === "draft" && canWrite && (
              <ActionForm
                action="count-stocktake"
                label="Ajukan Hasil Hitung"
                base={{ id: d.id }}
                fields={[
                  ...d.lines.map(
                    (l) =>
                      ({
                        name: `counts.${l.id}`,
                        label:
                          (items.find((i) => i.id === l.itemId)?.name ||
                            l.itemId) +
                          (l.assetId
                            ? " · " +
                              (l.details as { tag: string }).tag +
                              " (hadir 1 / hilang 0)"
                            : ""),
                        type: "number",
                        required: true,
                      }) as Field,
                  ),
                  {
                    name: "reason",
                    label: "Catatan/alasan selisih",
                    required: true,
                  },
                ]}
              />
            )}
            {d.status === "review" &&
              ["WAREHOUSE", "AUDITOR"].includes(user.role) &&
              d.actorId !== user.id && (
                <ActionForm
                  action="post-stocktake"
                  label="Review & Posting Adjustment"
                  base={{ id: d.id }}
                  fields={[
                    {
                      name: "reason",
                      label: "Alasan persetujuan",
                      required: true,
                    },
                  ]}
                />
              )}
            {["draft", "review"].includes(d.status) && canWrite && (
              <ActionForm
                action="cancel-stocktake"
                label="Batalkan Sesi & Buka Freeze"
                base={{ id: d.id }}
                fields={[
                  {
                    name: "reason",
                    label: "Alasan pembatalan",
                    required: true,
                  },
                ]}
              />
            )}
          </section>
        </>
      );
    }
    if (
      path === "/admin/maintenance" ||
      path === "/admin/incidents" ||
      path === "/me/incidents/new"
    ) {
      const assets = await db.asset.findMany({
        where: tech ? { custodianId: user.id } : {},
        orderBy: { tag: "asc" },
      });
      const records = await db.record.findMany({
        where: {
          kind: path.includes("maintenance") ? "maintenance" : "incident",
          ...scope,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return (
        <>
          <Heading
            title={
              path.includes("maintenance")
                ? "Maintenance & Kalibrasi"
                : "Laporkan Masalah"
            }
            description="Tindakan, hasil dan bukti per unit. Unit bermasalah tidak otomatis tersedia."
          />
          <section className="panel">
            <ActionForm
              action={path.includes("maintenance") ? "maintenance" : "incident"}
              fields={[
                {
                  name: "assetId",
                  label: "Unit",
                  type: "select",
                  options: assets.map((a) => ({
                    id: a.id,
                    name: a.tag + " · " + a.availability,
                  })),
                  required: true,
                },
                ...(path.includes("maintenance")
                  ? [
                      {
                        name: "result",
                        label: "Hasil/tindakan",
                        type: "select",
                        options: [
                          { id: "pass", name: "Lulus & Release" },
                          { id: "fail", name: "Gagal" },
                          { id: "blocked", name: "Blokir" },
                          { id: "installed", name: "Terpasang" },
                        ],
                        required: true,
                      } as Field,
                      {
                        name: "method",
                        label: "Metode/standar/buffer",
                        type: "text",
                      } as Field,
                      {
                        name: "validUntil",
                        label: "Berlaku sampai",
                        type: "datetime-local",
                      } as Field,
                      select("projectId", "Proyek instalasi", "project", false),
                    ]
                  : []),
                {
                  name: "reason",
                  label: "Kronologi, hasil dan tindak lanjut",
                  type: "textarea",
                  required: true,
                },
                { name: "photoId", label: "Foto bukti", type: "photo" },
              ]}
            />
          </section>
          <Table
            headers={["Waktu", "Jenis", "Status"]}
            rows={records.map((r) => [
              <DateLabel key="date" value={r.createdAt} />,
              r.kind,
              <Badge key="state" value={r.status} />,
            ])}
          />
        </>
      );
    }
    if (
      path === "/admin/consumable-returns" ||
      path === "/me/consumable-returns/new"
    ) {
      const lines = await db.line.findMany({
        where: {
          fulfilled: { gt: 0 },
          document: { ...scope, kind: "request" },
        },
        include: { document: true },
        take: 100,
      });
      const records = await db.record.findMany({
        where: { kind: "consumable-return", status: "open", ...scope },
      });
      return (
        <>
          <Heading
            title="Pengembalian Sisa"
            description="Sisa layak diterima petugas sebelum menambah stok; waste tidak mengurangi stok dua kali."
          />
          <Table
            headers={[
              "Transaksi",
              "Barang",
              "Diserahkan",
              "Kembali/Waste",
              "Aksi",
            ]}
            rows={lines
              .filter(
                (l) =>
                  items.find((i) => i.id === l.itemId)?.tracking === "quantity",
              )
              .map((l) => [
                l.document.number,
                items.find((i) => i.id === l.itemId)?.name,
                l.fulfilled.toString(),
                `${l.returned} / ${l.waste}`,
                <Link key={l.id} href={`${base}/requests/${l.documentId}`}>
                  Proses Sisa
                </Link>,
              ])}
          />
          {canWrite &&
            records.map((r) => (
              <section className="panel" key={r.id}>
                <h2>Pengajuan sisa {r.id}</h2>
                <ActionForm
                  action="receive-consumable"
                  label="Terima Sisa Layak"
                  base={{ id: r.id }}
                  fields={[
                    {
                      name: "reason",
                      label: "Hasil pemeriksaan kelayakan",
                      required: true,
                    },
                  ]}
                />
              </section>
            ))}
        </>
      );
    }
    if (path === "/notifications") {
      const rows = await db.notification.findMany({
        where: { recipientId: user.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return (
        <>
          <Heading
            title="Notifikasi"
            description="Pengingat pinjaman, kalibrasi dan stok minimum."
          />
          <Table
            headers={["Waktu", "Pengingat", "Detail", "Status"]}
            rows={rows.map((r) => [
              <DateLabel key="date" value={r.createdAt} />,
              r.message,
              <Link key={r.id} href={r.path}>
                Buka
              </Link>,
              r.readAt ? (
                "Sudah dibaca"
              ) : (
                <ActionForm
                  key="read"
                  action="notification-read"
                  label="Tandai Dibaca"
                  base={{ id: r.id }}
                />
              ),
            ])}
          />
        </>
      );
    }
    if (/^\/admin\/assets\/[^/]+$/.test(path)) {
      const asset = await db.asset.findUnique({ where: { id: segments[2] } });
      if (!asset) notFound();
      redirect(`/admin/items/${asset.itemId}`);
    }
    if (path === "/admin/users") {
      permit(user, "users");
      const users = await db.user.findMany({
        where: { role: { not: "SYSTEM" } },
        orderBy: { name: "asc" },
      });
      const editing = users.find(
        (u) => u.id === query.edit && u.id !== user.id,
      );
      return (
        <>
          <Heading
            title="Pengguna & Hak Akses"
            description="Penonaktifan/perubahan role mencabut session dan dicatat di audit."
          />
          <Table
            headers={["Nama", "Username", "Role", "Aktif", "MFA", "Aksi"]}
            rows={users.map((u) => [
              u.name,
              u.username,
              u.role,
              u.isActive ? "Ya" : "Tidak",
              u.twoFactorEnabled ? "Aktif" : "Belum",
              u.id !== user.id ? (
                <Link key="edit" href={`?edit=${u.id}`}>
                  Edit Akses
                </Link>
              ) : (
                "Akun Anda"
              ),
            ])}
          />
          <section className="panel">
            <h2>Ubah Akses</h2>
            {editing ? (
              <ActionForm
                key={editing.id}
                base={{ id: editing.id }}
                action="user-access"
                fields={[
                  {
                    name: "role",
                    label: "Role",
                    value: editing.role,
                    type: "select",
                    options: [
                      "ADMIN",
                      "WAREHOUSE",
                      "TECHNICIAN",
                      "AUDITOR",
                    ].map((r) => ({ id: r, name: r })),
                    required: true,
                  },
                  {
                    name: "active",
                    label: "Aktif",
                    type: "checkbox",
                    value: editing.isActive,
                  },
                  {
                    name: "emergencyIssue",
                    label:
                      "Permission emergency consumable (khusus Admin; hanya setelah disahkan manajemen)",
                    type: "checkbox",
                    value: editing.emergencyIssue,
                  },
                  { name: "reason", label: "Alasan", required: true },
                ]}
              />
            ) : (
              <p>Pilih Edit Akses pada pengguna yang ingin diubah.</p>
            )}
            <h2 style={{ marginTop: 32 }}>Tambah Akun Internal</h2>
            <ActionForm
              action="user-create"
              label="Buat Akun"
              fields={[
                { name: "username", label: "Username baru", required: true },
                { name: "name", label: "Nama lengkap", required: true },
                {
                  name: "role",
                  label: "Role",
                  type: "select",
                  options: ["ADMIN", "WAREHOUSE", "TECHNICIAN", "AUDITOR"].map(
                    (r) => ({ id: r, name: r }),
                  ),
                  value: "TECHNICIAN",
                  required: true,
                },
                {
                  name: "password",
                  label: "Password sementara (minimal 16 karakter)",
                  type: "password",
                  required: true,
                },
                {
                  name: "reason",
                  label: "Dasar pembuatan akun",
                  required: true,
                },
              ]}
            />
            <h2 style={{ marginTop: 32 }}>Reset Password Pengguna</h2>
            <ActionForm
              action="user-reset"
              label="Reset & Cabut Session"
              fields={[
                {
                  name: "id",
                  label: "Akun",
                  type: "select",
                  options: users
                    .filter((u) => u.id !== user.id)
                    .map((u) => ({ id: u.id, name: u.name })),
                  required: true,
                },
                {
                  name: "password",
                  label: "Password sementara baru (minimal 16 karakter)",
                  type: "password",
                  required: true,
                },
                { name: "reason", label: "Alasan reset", required: true },
              ]}
            />
          </section>
        </>
      );
    }
    if (path === "/admin/settings") {
      const settings = await getSettings();
      permit(user, "users");
      return (
        <>
          <Heading
            title="Pengaturan"
            description="Baseline kebijakan perlu disahkan pemilik proses sebelum operasional penuh."
          />
          <section className="panel">
            <ActionForm
              action="settings"
              fields={[
                {
                  name: "timezone",
                  label: "Timezone",
                  type: "select",
                  options: [
                    "Asia/Makassar",
                    "Asia/Singapore",
                    "Asia/Jakarta",
                  ].map((v) => ({ id: v, name: v })),
                  value: String(settings.timezone),
                  required: true,
                },
                {
                  name: "pickupHours",
                  label: "Masa reservasi (jam)",
                  type: "number",
                  value: String(settings.pickupHours),
                  required: true,
                },
                {
                  name: "formCode",
                  label: "Kode formulir QMS (kosong bila belum sah)",
                  value: String(settings.formCode),
                },
                {
                  name: "formRevision",
                  label: "Revisi formulir",
                  value: String(settings.formRevision),
                },
                {
                  name: "reason",
                  label: "Dasar keputusan/perubahan",
                  required: true,
                },
              ]}
            />
          </section>
        </>
      );
    }
    if (path === "/admin/audit") {
      permit(user, "read");
      const rows = await db.audit.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return (
        <>
          <Heading
            title="Audit Log"
            description="Rekaman aktor, tindakan dan perubahan. Tidak tersedia edit/hapus."
          />
          <Table
            headers={["Waktu", "Aktor", "Aksi", "Objek", "Detail"]}
            rows={rows.map((r) => [
              <DateLabel key="time" value={r.createdAt} />,
              r.actorId,
              r.action,
              r.entityId,
              <details key="payload">
                <summary>Lihat rekaman</summary>
                <pre>{JSON.stringify(r.payload, null, 2)}</pre>
              </details>,
            ])}
          />
        </>
      );
    }
    if (path === "/admin/overrides") {
      permit(user, "read");
      const rows = await db.record.findMany({
        where: { kind: "emergency_override" },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return (
        <>
          <Heading
            title="Review Pengeluaran Darurat"
            description="Pemeriksaan setelah override tidak membatalkan stok yang telah diserahkan. Koreksi melalui transaksi berjejak."
          />
          {rows.map((r) => (
            <section className="panel" key={r.id}>
              <p>
                <Link href={`/admin/requests/${r.referenceId}`}>
                  Lihat Transaksi
                </Link>{" "}
                · {r.status}
              </p>
              <p>{String((r.payload as { reason: string }).reason)}</p>
              {r.status === "pending_review" &&
                ["WAREHOUSE", "AUDITOR"].includes(user.role) &&
                r.actorId !== user.id && (
                  <ActionForm
                    action="review-override"
                    label="Selesaikan Review"
                    base={{ id: r.id }}
                    fields={[
                      {
                        name: "reason",
                        label: "Hasil pemeriksaan dan tindak lanjut",
                        type: "textarea",
                        required: true,
                      },
                    ]}
                  />
                )}
            </section>
          ))}
        </>
      );
    }
    if (path === "/admin/reports") {
      permit(user, "read");
      return (
        <>
          <Heading
            title="Laporan Inventory"
            description="Ringkasan saldo dan ledger; ekspor mengikuti hak akses dan dicatat."
          />
          <div className="actions">
            <form className="form-grid" action="/api/reports" target="_blank">
              <label>
                Jenis laporan
                <select name="type">
                  {[
                    ["stock", "Saldo Quantity"],
                    ["assets", "Unit Aset"],
                    ["loans", "Pinjaman & Overdue"],
                    ["reservations", "Reservasi"],
                    ["waste", "Waste"],
                    ["projects", "Pemakaian Proyek"],
                    ["stocktakes", "Stock Opname"],
                    ["audit", "Audit"],
                  ].map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Format
                <select name="format">
                  <option value="xlsx">Excel</option>
                  <option value="csv">CSV</option>
                  <option value="print">Cetak / Simpan PDF</option>
                </select>
              </label>
              <label>
                Lokasi
                <select name="location">
                  <option value="">Semua lokasi</option>
                  {options("location").map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Proyek
                <select name="project">
                  <option value="">Semua proyek</option>
                  {options("project").map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Dari tanggal
                <input type="date" name="from" />
              </label>
              <label>
                Sampai tanggal
                <input type="date" name="to" />
              </label>
              <button type="submit">Buka / Unduh Laporan</button>
            </form>
          </div>
          <Table
            headers={[
              "SKU",
              "Nama",
              "Lokasi",
              "Fisik",
              "Reservasi",
              "Tersedia",
              "Satuan",
            ]}
            rows={items.flatMap((i) =>
              i.balances.map((b) => [
                i.sku,
                i.name,
                lookup(b.locationId),
                b.onHand.toString(),
                b.reserved.toString(),
                b.onHand.sub(b.reserved).toString(),
                lookup(i.unitId),
              ]),
            )}
          />
        </>
      );
    }
    if (path === "/admin/issues/new" || path === "/admin/checkouts/new") {
      redirect("/admin/requests");
    }
    notFound();
  }
}
