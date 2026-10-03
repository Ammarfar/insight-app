import { Brain, Flame, Lightbulb, Sparkles, Target } from "lucide-react";
import { requireUser } from "@/features/auth/service";
import { getProgress } from "@/features/progress/service";
import { formatDate } from "@/lib/utils";

const eventLabels = { CREATE_INSIGHT: "Captured an insight", REVIEW_INSIGHT: "Reviewed an insight", CONNECT_INSIGHT: "Made a connection", COMPLETE_DAILY_REVIEW: "Completed daily review" } as const;

export default async function ProgressPage() {
  const user = await requireUser();
  const data = await getProgress(user.id);
  const levelXp = data.progress.totalXp % 100;
  const stats = [
    { icon: Lightbulb, value: data.stats.insightTotal, label: "Insights captured" },
    { icon: Brain, value: data.stats.reviewedThisWeek, label: "Reviewed this week" },
    { icon: Flame, value: `${data.progress.currentStreak} days`, label: "Current streak" },
    { icon: Target, value: `${data.progress.totalXp} XP`, label: "Total growth" },
  ];
  return <div className="page-shell"><header className="mb-9"><p className="eyebrow">Keep showing up</p><h1 className="font-serif text-4xl font-medium tracking-tight md:text-5xl">Your Progress</h1><p className="mt-2 font-serif text-muted">Every thoughtful return makes your knowledge stronger.</p></header><section className="flex flex-col gap-7 rounded-2xl bg-gradient-to-br from-progress-start to-progress-end p-7 text-on-strong shadow-xl md:flex-row md:items-center md:p-10"><div className="grid size-28 shrink-0 place-items-center rounded-full border border-on-strong/30 bg-on-strong/10 text-center"><div><Sparkles className="mx-auto" size={17} /><strong className="block font-serif text-4xl">{data.progress.level}</strong><span className="text-[9px] tracking-[.2em]">LEVEL</span></div></div><div className="flex-1"><span className="text-xs uppercase tracking-[.18em] text-on-strong/70">Level {data.progress.level}</span><h2 className="mt-1 font-serif text-3xl">Curious Mind</h2><p className="mt-1 text-sm text-on-strong/70">{100 - levelXp} XP until your next level</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-on-strong/15"><span className="block h-full rounded-full bg-progress-bar" style={{ width: `${levelXp}%` }} /></div><small className="mt-2 block text-right text-on-strong/65">{levelXp} / 100 XP</small></div></section><div className="my-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(({ icon: Icon, value, label }) => <article className="surface flex min-h-36 flex-col p-5" key={label}><Icon size={20} className="text-violet-700" /><strong className="mt-auto font-serif text-2xl">{value}</strong><span className="mt-1 text-xs text-muted">{label}</span></article>)}</div><section className="surface p-6"><h2 className="font-serif text-2xl">Recent learning activity</h2><div className="mt-5 grid gap-3">{data.activity.map((event) => <div key={event.id} className="flex items-center justify-between border-b border-line pb-3 last:border-0"><div><p className="text-sm font-medium">{eventLabels[event.type]}</p><time className="text-xs text-muted">{formatDate(event.createdAt)}</time></div><span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-700">+{event.amount} XP</span></div>)}</div></section></div>;
}
