"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const linkCls = (href: string) =>
    `px-3 py-1.5 rounded hover:bg-gray-100 ${pathname === href ? "text-black" : "text-gray-600"}`;
  return (
    <header className="border-b bg-white/70 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight text-lg">
          Freelance Flow
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/" className={linkCls("/")}>Dashboard</Link>
          <Link href="/categories" className={linkCls("/categories")}>Categories</Link>
        </nav>
      </div>
    </header>
  );
}
