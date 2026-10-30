"use client";
import { useRef, useState, useEffect } from "react";
import Form from "next/form";
import { LoaderCircle, Camera, CameraOff, Search } from "lucide-react";
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
      <h2>Scan atau masukkan kode</h2>
      <p>
        Scan membantu pencarian. Penyerahan tetap memerlukan review dan posting
        petugas.
      </p>
      <div className="scanner-buttons">
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
              const { BrowserMultiFormatReader } =
                await import("@zxing/browser");
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
            <>
              <Camera size={18} aria-hidden />
              Aktifkan Kamera
            </>
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
          <CameraOff size={18} aria-hidden />
          Hentikan Kamera
        </button>
      </div>
      <video ref={video} muted playsInline className="scanner-video" />
      <Form action="/scan">
        <label>
          Kode manual
          <input
            name="q"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <SearchSubmit>
          <Search size={18} aria-hidden />
          Cari Barang
        </SearchSubmit>
      </Form>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
