"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { currentUser } from "@/server/policy";
import { execute } from "@/server/inventory";
import { auth } from "@/server/auth";
import { db, Prisma } from "@/server/db";
export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
  id?: string;
};
export async function perform(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await currentUser();
  if (!user) return { error: "Sesi berakhir. Silakan masuk kembali." };
  try {
    const action = z.string().parse(form.get("action"));
    if (action === "password") {
      await auth.api.changePassword({
        headers: await headers(),
        body: {
          currentPassword: String(form.get("currentPassword") || ""),
          newPassword: z.string().min(12).parse(form.get("newPassword")),
          revokeOtherSessions: true,
        },
      });
      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { mustChangePassword: false },
        });
        await tx.audit.create({
          data: {
            actorId: user.id,
            action: "PASSWORD_CHANGED",
            entityId: user.id,
            payload: { otherSessionsRevoked: true },
          },
        });
      });
      revalidatePath("/", "layout");
      return {
        success:
          "Password berhasil diubah. Anda dapat melanjutkan ke Dashboard.",
      };
    }
    if (user.mustChangePassword)
      return {
        error:
          "Ubah password awal melalui Profil sebelum melakukan perubahan data.",
      };
    if (
      process.env.APP_MODE === "live" &&
      ["ADMIN", "WAREHOUSE", "AUDITOR"].includes(user.role) &&
      !user.twoFactorEnabled
    )
      return { error: "Aktifkan MFA melalui Profil sebelum melanjutkan." };
    const payload = JSON.parse(String(form.get("payload") || "{}"));
    const result = (await execute(
      user,
      String(form.get("key") || ""),
      action,
      payload,
    )) as { id?: string; number?: string };
    revalidatePath("/", "layout");
    return {
      success: `${result.number || "Data"} berhasil disimpan.`,
      id: result.id,
    };
  } catch (error) {
    if (error instanceof z.ZodError)
      return {
        error: "Periksa dan perbaiki kolom yang ditandai.",
        fieldErrors: Object.fromEntries(
          error.issues.map((i) => [i.path.join("."), i.message]),
        ),
      };
    if (error instanceof Prisma.PrismaClientKnownRequestError)
      return {
        error:
          error.code === "P2002"
            ? "Kode/tag/serial sudah digunakan. Periksa data lalu coba lagi."
            : "Perubahan tidak dapat disimpan. Muat ulang dan periksa referensi/status transaksi.",
      };
    return {
      error:
        error instanceof Error &&
        !/SQL|prisma|connection|database|query/i.test(error.message)
          ? error.message
          : "Terjadi kesalahan server. Data belum dipastikan tersimpan; periksa status sebelum retry.",
    };
  }
}
