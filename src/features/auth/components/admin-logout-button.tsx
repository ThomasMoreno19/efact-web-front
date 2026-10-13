"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutSuperadmin } from "@/features/auth/services/auth-client.service";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await logoutSuperadmin().catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      aria-label={isLoggingOut ? "Cerrando sesión" : "Cerrar sesión"}
      title="Cerrar sesión"
      disabled={isLoggingOut}
      onClick={handleLogout}
      className="ml-auto flex h-10 shrink-0 items-center gap-2 rounded-button border border-danger px-2.5 text-sm font-medium text-danger transition hover:bg-danger/10 hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60 sm:px-3"
    >
      <LogOut aria-hidden="true" className="size-4 shrink-0 text-danger" />
      <span className="hidden sm:inline">
        {isLoggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
      </span>
    </button>
  );
}
