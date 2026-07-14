"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/auth";
import { MODULOS } from "@/lib/modulos";

async function fetchMe() {
  const response = await fetch("/api/auth/me");
  if (!response.ok) {
    throw new Error("No autenticado");
  }
  return response.json();
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  const { data, isError } = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  useEffect(() => {
    if (isError) router.replace("/login");
  }, [isError, router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-6">
        <p className="mb-6 px-2 text-lg font-semibold text-slate-900">ControlCost</p>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {MODULOS.map((modulo) => {
            const isActive = pathname === modulo.href;
            return (
              <a
                key={modulo.href}
                href={modulo.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <i className={`fa-solid ${modulo.icon} w-4 text-center text-xs`} />
                <span className="flex-1">{modulo.name}</span>
                {modulo.status === "proximamente" && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      isActive ? "bg-white/20 text-white" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    Próx.
                  </span>
                )}
              </a>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 pt-4">
          <p className="px-2 text-sm font-medium text-slate-900">{user?.nombre ?? "..."}</p>
          <p className="px-2 text-xs text-slate-500">{user?.rol}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
