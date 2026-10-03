import { BotanicalArt } from "@/components/botanical-art";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/features/auth/service";
import { OpenCaptureButton } from "@/features/insights/components/open-capture-button";
import { listRecentInsights } from "@/features/insights/repository";
import { getProgress } from "@/features/progress/service";
import { resolveReviewAction, skipReviewAction } from "@/features/reviews/actions";
import { getDailyReview } from "@/features/reviews/service";
import { formatDate } from "@/lib/utils";
import { ArrowRight, Brain, Check, Flame, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireUser();
  const [recent, review, progressData] = await Promise.all([
    listRecentInsights(user.id, 4), getDailyReview(user.id), getProgress(user.id),
  ]);
  const levelXp = progressData.progress.totalXp % 100;
  return (
    <>
      <section className="relative mx-auto grid min-h-[295px] max-w-[1380px] grid-cols-1 items-center overflow-hidden px-4 lg:grid-cols-[1fr_minmax(540px,780px)_1fr]">
        <aside className="hidden max-w-[200px] pl-3 font-serif text-muted lg:block"><blockquote className="text-lg italic leading-8">“A more curious you leads to a brighter tomorrow.”</blockquote><span className="my-4 block w-9 border-t border-stone-400" /><p className="text-xs tracking-[.18em]">Keep learning.</p></aside>
        <div className="z-10 py-11 text-center"><p className="eyebrow">{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</p><h1 className="font-serif text-4xl font-medium tracking-[-.04em] md:text-5xl">What are you learning?</h1><p className="mb-7 mt-2 font-serif text-muted">Small insights compound into a wiser you.</p><OpenCaptureButton /></div>
        <BotanicalArt />
      </section>

      <div className="surface mx-auto mb-16 w-[min(1180px,calc(100%-24px))] p-4 md:p-5">
        <div className="mb-3 flex items-end justify-between"><div><h2 className="font-serif text-2xl">Continue Learning</h2><p className="font-serif text-sm text-muted">Revisit past insights to strengthen your understanding.</p></div><Link href="/insights" className="flex items-center gap-2 text-xs">View all <ArrowRight size={15} /></Link></div>
        {review.insight ? (
          <article className="grid gap-4 rounded-xl border border-line bg-surface p-5 md:grid-cols-[70px_1fr_250px] md:items-center">
            <div className="grid size-14 place-items-center rounded-full bg-violet-100 text-violet-700"><Brain /></div>
            <div><p className="font-serif text-lg font-medium">{review.insight.title || "Untitled insight"}</p><div className="my-2 flex flex-wrap gap-2">{review.insight.source && <span className="rounded-full bg-subtle px-3 py-1 text-[11px] text-muted">{review.insight.source.title}</span>}{review.insight.topics.map((topic) => <span className="topic-pill" key={topic.id}>{topic.name}</span>)}</div><p className="line-clamp-2 font-serif text-sm leading-6 text-muted">“{review.insight.content}”</p></div>
            <div className="grid gap-2 border-t border-line pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0"><p className="text-xs text-muted">{review.remaining} of {review.total} waiting today</p><div className="flex gap-2"><form action={skipReviewAction}><input type="hidden" name="sessionId" value={review.session.id} /><input type="hidden" name="insightId" value={review.insight.id} /><Button variant="outline" size="sm">Skip</Button></form><form action={resolveReviewAction}><input type="hidden" name="sessionId" value={review.session.id} /><input type="hidden" name="insightId" value={review.insight.id} /><input type="hidden" name="result" value="REMEMBERED" /><Button variant="violet" size="sm">Remembered <Check size={15} /></Button></form></div><form action={resolveReviewAction}><input type="hidden" name="sessionId" value={review.session.id} /><input type="hidden" name="insightId" value={review.insight.id} /><input type="hidden" name="result" value="NEEDS_REVIEW" /><button className="text-left text-xs text-violet-700 underline-offset-4 hover:underline">I need another review</button></form></div>
          </article>
        ) : <div className="flex items-center gap-4 rounded-xl border border-line bg-sage-50 p-6"><div className="grid size-12 place-items-center rounded-full bg-sage-100 text-sage-700"><Check /></div><div><h3 className="font-serif text-lg">You’re all caught up.</h3><p className="text-sm text-muted">New and resurfaced insights will appear here.</p></div></div>}

        <section className="mt-6"><div className="mb-2 flex items-center justify-between"><div><h2 className="font-serif text-2xl">Recently Learned</h2><p className="font-serif text-sm text-muted">A record of your latest insights and ideas.</p></div><div className="hidden items-center gap-4 text-xs text-muted sm:flex"><span className="flex items-center gap-1"><Flame size={14} />{progressData.progress.currentStreak} day streak</span><span className="flex items-center gap-1"><Sparkles size={14} />Level {progressData.progress.level}</span></div></div>
          <div>{recent.map((insight, index) => <article key={insight.id} className="grid grid-cols-[70px_24px_1fr] border-b border-line py-4 last:border-0 md:grid-cols-[92px_38px_1fr]"><time className="text-[10px] uppercase tracking-[.1em] text-muted">{formatDate(insight.createdAt, { month: "short", day: "2-digit" })}<span className="block">{insight.createdAt.getFullYear()}</span></time><span className={`mt-1 size-3 rounded-full ${["bg-sky-400","bg-violet-400","bg-orange-300","bg-sage-500"][index % 4]}`} /><div><Link href={`/insights/${insight.id}`} className="font-serif text-base font-medium hover:text-violet-700 md:text-lg">{insight.title || insight.content.slice(0, 70)}</Link><div className="mt-2 flex flex-wrap gap-2">{insight.topics.map((topic) => <span className="topic-pill" key={topic.id}>{topic.name}</span>)}</div><p className="mt-2 line-clamp-2 max-w-3xl font-serif text-sm leading-6 text-muted">{insight.content}</p></div></article>)}</div>
        </section>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-subtle"><span className="block h-full bg-sage-500" style={{ width: `${levelXp}%` }} /></div>
      </div>
    </>
  );
}
