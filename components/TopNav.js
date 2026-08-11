"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/roster", label: "Create Roster" },
  { href: "/roster?view=archive", label: "Old Rosters" },
  { href: "/employees", label: "Employees" },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-mark">
          <Image src="/logo.png" alt="24x7 Retail" width={40} height={40} style={{ objectFit: "contain" }} />
        </div>
        <div>
          <div className="brand-title">Duty Roster</div>
        </div>
      </div>
      <nav className="topbar-nav">
        {LINKS.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className={pathname === l.href.split("?")[0] && !l.href.includes("archive") ? "active" : ""}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="topbar-actions">
        <button className="ghost" onClick={handleLogout}>Log out</button>
      </div>
    </header>
  );
}
