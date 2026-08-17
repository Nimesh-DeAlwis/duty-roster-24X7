"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const ALL_LINKS = [
  { href: "/", label: "Dashboard", roles: ["admin", "staff"] },
  { href: "/roster", label: "Create Roster", roles: ["admin"] },
  { href: "/roster?view=archive", label: "Old Rosters", roles: ["admin", "staff"] },
  { href: "/employees", label: "Employees", roles: ["admin"] },
  { href: "/audit", label: "Audit Log", roles: ["admin"] },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState(null);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setRole(d.role)).catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const links = ALL_LINKS.filter((l) => !role || l.roles.includes(role));

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-mark">
          <Image src="/logo.png" alt="24x7 Retail" width={38} height={38} style={{ objectFit: "contain" }} />
        </div>
        <div className="brand-title">Duty Roster</div>
        {role === "staff" && <span className="role-badge">Viewer</span>}
      </div>
      <nav className="topbar-nav">
        {links.map((l) => {
          const base = l.href.split("?")[0];
          const isActive = pathname === base && !l.href.includes("archive");
          return (
            <Link key={l.label} href={l.href} className={isActive ? "active" : ""}>
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="topbar-actions">
        <button className="ghost" onClick={handleLogout}>Log out</button>
      </div>
    </header>
  );
}
