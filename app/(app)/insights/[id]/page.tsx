import Link from "next/link";
import { ArrowLeft, Link2, Unlink } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { requireUser } from "@/features/auth/service";
import { connectInsightsAction, disconnectInsightsAction } from "@/features/insights/actions";
import { DeleteInsightButton } from "@/features/insights/components/delete-insight-button";
import { InsightEditor } from "@/features/insights/components/insight-editor";
import { getCaptureOptions, getConnectionCandidates, getInsightDetail } from "@/features/insights/repository";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function InsightDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const [insight, options, candidates] = await Promise.all([getInsightDetail(user.id, id), getCaptureOptions(user.id), getConnectionCandidates(user.id, id)]);
  if (!insight) notFound();
  const connectedIds = new Set(insight.connections.map((connection) => connection.insight.id));
  return (
    <div className="page-shell">
      <Link href="/insights" className="mb-7 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><ArrowLeft size={16} />Back to insights</Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="surface p-6 md:p-8"><div className="mb-7 flex items-start justify-between gap-4"><div><p className="eyebrow">Insight detail</p><h1 className="font-serif text-3xl font-medium md:text-4xl">{insight.title || "Untitled insight"}</h1><p className="mt-2 text-xs text-muted">Captured {formatDate(insight.createdAt)} · Updated {formatDate(insight.updatedAt)}</p></div><DeleteInsightButton insightId={insight.id} /></div><InsightEditor insight={insight} topics={options.topics.map(({ id, name }) => ({ id, name }))} sources={options.sources.map(({ id, title }) => ({ id, title }))} /></section>
        <aside className="grid content-start gap-5">
          <section className="surface p-5"><h2 className="font-serif text-xl">Related insights</h2><p className="mt-1 text-xs text-muted">Connect this idea to knowledge you already have.</p><form action={connectInsightsAction} className="mt-4 flex gap-2"><input type="hidden" name="insightId" value={insight.id} /><Select required name="targetInsightId" containerClassName="min-w-0 flex-1"><option value="">Choose an insight</option>{candidates.filter((item) => !connectedIds.has(item.id)).map((item) => <option key={item.id} value={item.id}>{item.title || item.content.slice(0, 50)}</option>)}</Select><Button size="icon" aria-label="Connect insight"><Link2 size={16} /></Button></form><div className="mt-4 grid gap-2">{insight.connections.map((connection) => <div key={connection.id} className="flex items-center gap-2 rounded-lg bg-violet-50 p-3"><Link href={`/insights/${connection.insight.id}`} className="min-w-0 flex-1 truncate font-serif text-sm">{connection.insight.title || connection.insight.content.slice(0, 45)}</Link><form action={disconnectInsightsAction}><input type="hidden" name="insightId" value={insight.id} /><input type="hidden" name="connectionId" value={connection.id} /><button aria-label="Disconnect insight" className="text-muted hover:text-danger"><Unlink size={15} /></button></form></div>)}</div></section>
          <section className="surface p-5"><h2 className="font-serif text-xl">Review history</h2><div className="mt-4 grid gap-3">{insight.reviews.length ? insight.reviews.map((review) => <div key={review.id} className="flex justify-between border-b border-line pb-3 text-xs last:border-0"><span className={review.result === "REMEMBERED" ? "text-sage-700" : "text-violet-700"}>{review.result === "REMEMBERED" ? "Remembered" : "Needs review"}</span><time className="text-muted">{formatDate(review.reviewedAt)}</time></div>) : <p className="text-sm text-muted">No reviews yet.</p>}</div></section>
        </aside>
      </div>
    </div>
  );
}
