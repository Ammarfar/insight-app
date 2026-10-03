"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Lightbulb, Menu, Settings, Tags, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/topics", label: "Topics", icon: Tags },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="ml-2 grid size-10 place-items-center rounded-lg md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
      <nav className={cn("absolute left-4 right-4 top-16 hidden rounded-xl border border-line bg-field p-2 shadow-xl md:static md:flex md:self-stretch md:border-0 md:bg-transparent md:p-0 md:shadow-none", open && "grid")} aria-label="Primary navigation">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("relative flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-muted transition hover:text-ink md:rounded-none", active && "bg-sage-50 text-ink md:bg-transparent md:after:absolute md:after:inset-x-4 md:after:bottom-0 md:after:h-0.5 md:after:bg-sage-500")}><Icon size={16} className="md:hidden" />{label}</Link>;
        })}
      </nav>
    </>
  );
}
