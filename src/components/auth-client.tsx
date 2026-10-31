"use client";
import Link from "next/link";
import Image from "next/image";
import { createAuthClient } from "better-auth/react";
import { usernameClient, twoFactorClient } from "better-auth/client/plugins";
import { useState, useSyncExternalStore } from "react";
import { LogOut, LoaderCircle } from "lucide-react";

const client = createAuthClient({
  plugins: [usernameClient(), twoFactorClient()],
});
const subscribeHydration = () => () => {};
export function Login() {
  const ready = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfa, setMfa] = useState(false);
  const [recovery, setRecovery] = useState(false);
  return (
    <form
      method="post"
      className="data-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const f = new FormData(e.currentTarget);
        try {
          const result = mfa
            ? recovery
              ? await client.twoFactor.verifyBackupCode({
                  code: String(f.get("code")),
                })
              : await client.twoFactor.verifyTotp({
                  code: String(f.get("code")),
                })
            : await client.signIn.username({
                username: String(f.get("username")),
                password: String(f.get("password")),
              });
          if (result.error) {
            setError(
              "Login tidak berhasil. Periksa akun/kode atau coba lagi nanti.",
            );
            return;
          }
          if (!mfa && "twoFactorRedirect" in (result.data || {})) {
            setMfa(true);
            return;
          }
          window.location.assign("/");
        } catch {
          setError("Server tidak dapat dihubungi. Silakan coba lagi.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && (
        <div className="alert danger" role="alert">
          {error}
        </div>
      )}
      {mfa ? (
        <label>
          {recovery ? "Recovery code" : "Kode autentikator"}
          <input
            name="code"
            inputMode={recovery ? "text" : "numeric"}
            autoComplete="one-time-code"
            required
          />
        </label>
      ) : (
        <>
          <label>
            Username
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
        </>
      )}
      <noscript>Aktifkan JavaScript pada browser agar dapat masuk.</noscript>
      <button disabled={busy || !ready}>
        {!ready
          ? "Menyiapkan form…"
          : busy
            ? "Memeriksa…"
            : mfa
              ? "Verifikasi"
              : "Masuk"}
      </button>
      {mfa && (
        <button
          className="secondary"
          type="button"
          onClick={() => setRecovery(!recovery)}
        >
          {recovery ? "Gunakan Autentikator" : "Gunakan Recovery Code"}
        </button>
      )}
      <Link href="/forgot-password">Lupa password?</Link>
    </form>
  );
}
export function Logout() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <button
        type="button"
        className="account-menu-logout"
        disabled={busy}
        aria-busy={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const result = await client.signOut();
            if (result.error) throw new Error("Sign out failed");
            window.location.assign("/login");
          } catch {
            setError("Belum bisa keluar. Coba lagi.");
            setBusy(false);
          }
        }}
      >
        {busy ? (
          <LoaderCircle size={19} className="loading-spinner" aria-hidden />
        ) : (
          <LogOut size={19} aria-hidden />
        )}
        {busy ? "Keluar…" : "Keluar"}
      </button>
      {error && (
        <p className="account-menu-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
export function MfaSetup() {
  const [uri, setUri] = useState("");
  const [qr, setQr] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  return (
    <form
      method="post"
      className="data-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        if (!uri) {
          const r = await client.twoFactor.enable({
            password: String(f.get("password")),
          });
          if (r.error) {
            setMessage("Tidak dapat mengaktifkan MFA. Periksa password.");
            return;
          }
          if (r.data.method !== "totp") {
            setMessage("Metode autentikator tidak tersedia.");
            return;
          }
          setUri(r.data.totpURI);
          const QRCode = (await import("qrcode")).default;
          setQr(await QRCode.toDataURL(r.data.totpURI));
          setCodes(r.data.backupCodes);
        } else {
          const r = await client.twoFactor.verifyTotp({
            code: String(f.get("code")),
          });
          setMessage(
            r.error
              ? "Kode belum benar."
              : "MFA aktif. Simpan recovery code di tempat aman.",
          );
        }
      }}
    >
      <h3>Autentikasi dua faktor</h3>
      <p>
        Gunakan aplikasi autentikator. Recovery code ditampilkan hanya di sesi
        ini.
      </p>
      {!uri ? (
        <label>
          Password saat ini
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
      ) : (
        <>
          {/* QR is generated locally from the current enrollment secret, never logged. */}
          {qr && (
            <Image
              unoptimized
              src={qr}
              alt="QR pendaftaran autentikator"
              width={180}
              height={180}
            />
          )}
          <details>
            <summary>Kunci konfigurasi manual</summary>
            <code>{uri}</code>
          </details>
          <label>
            Kode autentikator
            <input name="code" autoComplete="one-time-code" required />
          </label>
          <details>
            <summary>Simpan recovery code</summary>
            <pre>{codes.join("\n")}</pre>
          </details>
        </>
      )}
      <button>{uri ? "Verifikasi MFA" : "Aktifkan MFA"}</button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
