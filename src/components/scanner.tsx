"use client";
import { useRef, useState, useEffect } from "react";
import Form from "next/form";
import { LoaderCircle } from "lucide-react";
import { SearchSubmit } from "./navigation";
export function Scanner() {
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<{ stop: () => void } | null>(null);
  const attempt = useRef(0);
  const [starting, setStarting] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  useEffect(
    () => () => {
      attempt.current++;
      controls.current?.stop();
    },
    [],
  );
  return (
    <section className="panel">
      <h3>Scan atau masukkan kode</h3>
      <p>
        Scan membantu pencarian. Penyerahan tetap memerlukan review dan posting
        petugas.
      </p>
      <button
        className="secondary"
        type="button"
        disabled={starting}
        aria-busy={starting}
        onClick={async () => {
          const current = ++attempt.current;
          setStarting(true);
          setError("");
          try {
            const { BrowserMultiFormatReader } = await import("@zxing/browser");
            if (current !== attempt.current) return;
            if (!video.current) return;
            controls.current?.stop();
            const active =
              await new BrowserMultiFormatReader().decodeFromVideoDevice(
                undefined,
                video.current,
                (result) => {
                  if (result) {
                    setValue(result.getText());
                    controls.current?.stop();
                  }
                },
              );
            if (current === attempt.current) controls.current = active;
            else active.stop();
          } catch {
            if (current === attempt.current)
              setError(
                "Akses kamera belum tersedia. Gunakan input kode manual.",
              );
          } finally {
            if (current === attempt.current) setStarting(false);
          }
        }}
      >
        {starting ? (
          <>
            <LoaderCircle size={18} className="loading-spinner" aria-hidden />
            Menyiapkan kamera…
          </>
        ) : (
          "Aktifkan Kamera"
        )}
      </button>
      <button
        className="secondary"
        type="button"
        onClick={() => {
          attempt.current++;
          controls.current?.stop();
          setStarting(false);
        }}
      >
        Hentikan Kamera
      </button>
      <video ref={video} muted playsInline className="scanner-video" />
      <Form action="/me/items">
        <label>
          Kode manual
          <input
            name="q"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <SearchSubmit>Cari Barang</SearchSubmit>
      </Form>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
