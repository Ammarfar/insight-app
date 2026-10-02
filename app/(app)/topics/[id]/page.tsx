import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/service";
import { getTopicDetail } from "@/features/topics/repository";
import { formatDate } from "@/lib/utils";

export default async function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const data = await getTopicDetail(user.id, id);
  if (!data) notFound();
  return <div className="page-shell"><Link href="/topics" className="mb-7 inline-flex items-center gap-2 text-sm text-muted"><ArrowLeft size={16} />All topics</Link><header className="mb-9"><p className="eyebrow">Knowledge area</p><h1 className="font-serif text-5xl font-medium tracking-tight">{data.topic.name}</h1><p className="mt-2 font-serif text-muted">{data.total} insights connected to this topic.</p></header><div className="grid gap-6 lg:grid-cols-[1fr_320px]"><section className="grid gap-3">{data.insights.map((insight) => <Link href={`/insights/${insight.id}`} key={insight.id} className="surface block p-5 transition hover:border-violet-200"><span className="text-[10px] uppercase tracking-wider text-muted">{formatDate(insight.createdAt)}</span><h2 className="mt-2 font-serif text-lg">{insight.title || insight.content.slice(0, 80)}</h2><p className="mt-1 line-clamp-2 font-serif text-sm leading-6 text-muted">{insight.content}</p></Link>)}</section><aside className="surface h-fit p-5"><h2 className="flex items-center gap-2 font-serif text-xl"><BookOpen size={18} />Recently reviewed</h2><div className="mt-4 grid gap-3">{data.recentlyReviewed.length ? data.recentlyReviewed.map((item) => <Link href={`/insights/${item.id}`} key={`${item.id}-${item.reviewedAt.toISOString()}`} className="border-b border-line pb-3 text-sm last:border-0"><span className="font-serif">{item.title || "Untitled insight"}</span><time className="mt-1 block text-[11px] text-muted">{formatDate(item.reviewedAt)}</time></Link>) : <p className="text-sm text-muted">Nothing reviewed in this topic yet.</p>}</div></aside></div></div>;
}
