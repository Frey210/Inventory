"use client";
import { useRef, useState, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
export function Scanner() {
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<{ stop: () => void } | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  useEffect(() => () => controls.current?.stop(), []);
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
        onClick={async () => {
          try {
            if (!video.current) return;
            controls.current?.stop();
            controls.current =
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
          } catch {
            setError("Akses kamera belum tersedia. Gunakan input kode manual.");
          }
        }}
      >
        Aktifkan Kamera
      </button>
      <button
        className="secondary"
        type="button"
        onClick={() => controls.current?.stop()}
      >
        Hentikan Kamera
      </button>
      <video ref={video} muted playsInline className="scanner-video" />
      <form action="/me/items">
        <label>
          Kode manual
          <input
            name="q"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <button>Cari Barang</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
