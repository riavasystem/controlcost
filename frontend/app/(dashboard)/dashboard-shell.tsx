"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/unidades", label: "Unidades" },
  { href: "/dashboard/residentes", label: "Residentes" },
];

async function fetchMe() {
  const response = await fetch("/api/auth/me");
  if (!response.ok) {
    throw new Error("No autenticado");
  }
  return response.json();
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
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
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white px-4 py-6">
        <p className="mb-6 px-2 text-lg font-semibold text-slate-900">ControlCost</p>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </a>
          ))}
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
