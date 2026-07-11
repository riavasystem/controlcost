"use client";

import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "#modulos", label: "Módulos" },
  { href: "#ley", label: "Ley 21.442" },
  { href: "#tecnologia", label: "Tecnología" },
  { href: "#comparativa", label: "Comparativa" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="cip-nav-toggle"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className="cip-mobile-menu">
          <ul>
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/login" onClick={() => setOpen(false)}>
                Ingresar
              </Link>
            </li>
            <li>
              <a href="#contacto" className="cip-nav-cta" onClick={() => setOpen(false)}>
                Solicitar Demo
              </a>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}
