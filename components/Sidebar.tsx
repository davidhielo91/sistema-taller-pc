"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth";

export function Sidebar({
  nombre,
  rol,
}: {
  nombre: string;
  rol: string;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/ordenes", label: "Órdenes" },
    { href: "/dashboard/clientes", label: "Clientes" },
    { href: "/dashboard/reportes", label: "Reportes" },
    ...(rol === "ADMIN"
      ? [
          { href: "/dashboard/ajustes", label: "Ajustes" },
          { href: "/dashboard/usuarios", label: "Usuarios" },
        ]
      : []),
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h2>Taller PC</h2>
      </div>
      <ul className="sidebar-menu">
        {links.map((link) => {
          const isActive =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={isActive ? "active" : ""}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-name">{nombre}</span>
          <span className="user-role">
            {rol === "ADMIN" ? "Administrador" : "Técnico"}
          </span>
        </div>
        <form action={logout}>
          <button type="submit" className="btn-logout">
            Cerrar sesión
          </button>
        </form>
      </div>
    </nav>
  );
}
