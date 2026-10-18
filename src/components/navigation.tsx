"use client";
import Link, { useLinkStatus } from "next/link";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";

function NavigationPending() {
  const { pending } = useLinkStatus();
  return pending ? (
    <div
      className="navigation-progress"
      role="status"
      aria-label="Membuka halaman"
    >
      <span aria-hidden />
      <span className="sr-only">Membuka halaman…</span>
    </div>
  ) : null;
}
export function NavigationLink({
  children,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <NavigationPending />
    </Link>
  );
}
export function SearchSubmit({ children, ...props }: ComponentProps<"button">) {
  const { pending } = useFormStatus();
  return (
    <button
      {...props}
      className={`${props.className || ""} search-submit-button`}
      type="submit"
      disabled={pending || props.disabled}
      aria-busy={pending}
    >
      <span className={`search-submit-content ${pending ? "is-pending" : ""}`}>
        {children}
      </span>
      {pending && (
        <LoaderCircle
          className="loading-spinner search-submit-loader"
          size={18}
          aria-hidden
        />
      )}
    </button>
  );
}
