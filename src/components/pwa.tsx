"use client";
import { useEffect, useState } from "react";
type InstallEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
let installEvent: InstallEvent | null = null;
export function Pwa() {
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    const capture = (event: Event) => {
      event.preventDefault();
      installEvent = event as InstallEvent;
      window.dispatchEvent(new Event("mtc-install-ready"));
    };
    const installed = () => {
      installEvent = null;
      window.dispatchEvent(new Event("mtc-install-ready"));
    };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  return null;
}
export function InstallApp() {
  const [available, setAvailable] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const update = () => setAvailable(!!installEvent);
    update();
    window.addEventListener("mtc-install-ready", update);
    return () => window.removeEventListener("mtc-install-ready", update);
  }, []);
  return (
    <section className="panel">
      <h2>Pasang MTC Inventory</h2>
      <p>
        Buka aplikasi langsung dari layar utama. Transaksi tetap memerlukan
        internet.
      </p>
      {available && (
        <button
          type="button"
          onClick={async () => {
            const event = installEvent;
            if (!event) return;
            setAvailable(false);
            try {
              await event.prompt();
              const choice = await event.userChoice;
              setMessage(
                choice.outcome === "accepted"
                  ? "Pemasangan diterima. Ikuti petunjuk perangkat."
                  : "Anda tetap dapat memakai versi web.",
              );
            } catch {
              setMessage("Gunakan menu browser untuk memasang aplikasi.");
            } finally {
              installEvent = null;
            }
          }}
        >
          Pasang aplikasi
        </button>
      )}
      <p>
        Android / komputer: menu Chrome atau Edge, pilih{" "}
        <strong>Pasang aplikasi</strong>. iPhone / iPad: buka lewat Safari,
        ketuk <strong>Bagikan</strong>, lalu{" "}
        <strong>Tambahkan ke Layar Utama</strong>.
      </p>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
