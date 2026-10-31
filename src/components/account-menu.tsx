"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Settings, UserRound } from "lucide-react";
import { NavigationLink } from "./navigation";
import { Logout } from "./auth-client";

export function AccountMenu({
  name,
  role,
  admin,
}: {
  name: string;
  role: string;
  admin: boolean;
}) {
  const id = useId();
  const popup = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    popup.current?.hidePopover();
  }, [pathname]);
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
  return (
    <>
      <button
        type="button"
        className="account-profile"
        popoverTarget={id}
        aria-label={`Menu akun ${name}`}
        aria-expanded={open}
        aria-controls={id}
      >
        <span className="avatar" aria-hidden>
          {initials}
        </span>
        <span className="account-name">
          <strong>{name}</strong>
          <small>{role}</small>
        </span>
        <ChevronDown className="account-chevron" size={16} aria-hidden />
      </button>
      <nav
        id={id}
        ref={popup}
        popover="auto"
        className="account-dropdown"
        aria-label="Menu akun"
        onToggle={(event) => setOpen(event.newState === "open")}
      >
        <div className="account-dropdown-identity">
          <span className="avatar" aria-hidden>
            {initials}
          </span>
          <div>
            <strong>{name}</strong>
            <small>{role}</small>
          </div>
        </div>
        <NavigationLink
          href="/profile"
          onClick={() => popup.current?.hidePopover()}
        >
          <UserRound size={19} aria-hidden />
          Pengaturan akun
        </NavigationLink>
        {admin && (
          <NavigationLink
            href="/admin/settings"
            onClick={() => popup.current?.hidePopover()}
          >
            <Settings size={19} aria-hidden />
            Pengaturan aplikasi
          </NavigationLink>
        )}
        <div className="account-dropdown-exit">
          <Logout />
        </div>
      </nav>
    </>
  );
}
