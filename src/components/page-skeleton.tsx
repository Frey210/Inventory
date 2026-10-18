import { LoaderCircle } from "lucide-react";

export function PageSkeleton() {
  return (
    <section className="page-loading" role="status" aria-label="Memuat halaman">
      <div className="loading-caption">
        <LoaderCircle className="loading-spinner" size={20} aria-hidden />
        <span>Halaman sedang disiapkan…</span>
      </div>
      <div className="page-skeleton" aria-hidden="true">
        <div className="skeleton-heading" />
        <div className="skeleton-description" />
        <div className="skeleton-toolbar" />
        <div className="skeleton-rows">
          {[0, 1, 2].map((i) => (
            <div className="skeleton-row" key={i}>
              <span />
              <span />
              <span />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
