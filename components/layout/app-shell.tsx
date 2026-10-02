import Link from "next/link";
import { Leaf, LogOut } from "lucide-react";
import { AppNavigation } from "./app-navigation";
import { QuickCapture } from "@/features/insights/components/quick-capture";
import { signOutAction } from "@/features/auth/actions";

type Option = { id: string; name?: string; title?: string };

export function AppShell({ children, user, topics, sources, showSignOut }: { children: React.ReactNode; user: { name?: string | null; email?: string | null }; topics: Option[]; sources: Option[]; showSignOut: boolean }) {
  const initials = (user.name || user.email || "You").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 h-[60px] border-b border-line/80 bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto grid h-full max-w-[1240px] grid-cols-[1fr_auto] items-center px-4 md:grid-cols-[220px_1fr_220px] md:px-6">
          <Link href="/" className="flex items-center gap-2 font-serif text-xl font-semibold"><Leaf className="text-sage-600" fill="currentColor" /><span>InsightFlow</span></Link>
          <AppNavigation />
          <div className="flex items-center justify-end gap-3">
            <QuickCapture topics={topics.map((topic) => ({ id: topic.id, name: topic.name! }))} sources={sources.map((source) => ({ id: source.id, title: source.title! }))} />
            <span className="hidden size-9 place-items-center rounded-full bg-slate-100 text-xs text-slate-600 sm:grid">{initials}</span>
            {showSignOut && <form action={signOutAction}><button aria-label="Sign out" className="hidden size-9 place-items-center rounded-lg text-muted hover:bg-stone-100 sm:grid"><LogOut size={16} /></button></form>}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
