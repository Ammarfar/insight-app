import Link from "next/link";
import { Leaf, LogOut } from "lucide-react";
import { AppNavigation } from "./app-navigation";
import { QuickCapture } from "@/features/insights/components/quick-capture";
import { signOutAction } from "@/features/auth/actions";
import { ThemeToggle } from "@/features/theme/components/theme-toggle";
import type { ThemeMode } from "@/features/theme/contracts";

type Option = { id: string; name?: string; title?: string };

export function AppShell({ children, initialTheme, user, topics, sources, showSignOut }: { children: React.ReactNode; initialTheme: ThemeMode; user: { name?: string | null; email?: string | null }; topics: Option[]; sources: Option[]; showSignOut: boolean }) {
  const initials = (user.name || user.email || "You").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 h-[60px] border-b border-line/80 bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto grid h-full max-w-[1240px] grid-cols-[1fr_auto_auto] items-center gap-1 px-4 md:grid-cols-[220px_1fr_220px] md:gap-0 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-serif text-xl font-semibold"><Leaf className="text-sage-600" fill="currentColor" /><span>InsightFlow</span></Link>
          <AppNavigation />
          <div className="flex items-center justify-end gap-3">
            <ThemeToggle initialTheme={initialTheme} />
            <QuickCapture topics={topics.map((topic) => ({ id: topic.id, name: topic.name! }))} sources={sources.map((source) => ({ id: source.id, title: source.title! }))} />
            <span className="hidden size-9 place-items-center rounded-full bg-subtle text-xs text-muted sm:grid">{initials}</span>
            {showSignOut && <form action={signOutAction}><button aria-label="Sign out" className="hidden size-9 place-items-center rounded-lg text-muted transition hover:bg-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 sm:grid"><LogOut size={16} /></button></form>}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
