import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { requireUser } from "@/features/auth/service";
import { insightFiltersSchema } from "@/features/insights/contracts";
import { getCaptureOptions, listInsights } from "@/features/insights/repository";
import { formatDate } from "@/lib/utils";

type Props = { searchParams: Promise<{ q?: string; topic?: string; source?: string; page?: string }> };

export default async function InsightsPage({ searchParams }: Props) {
  const user = await requireUser();
  const query = await searchParams;
  const filters = insightFiltersSchema.parse({ query: query.q, topicId: query.topic || undefined, sourceId: query.source || undefined, page: query.page });
  const [library, options] = await Promise.all([listInsights(user.id, filters), getCaptureOptions(user.id)]);
  const pages = Math.ceil(library.total / library.pageSize);
  const pageHref = (page: number) => `/insights?${new URLSearchParams({ ...(filters.query && { q: filters.query }), ...(filters.topicId && { topic: filters.topicId }), ...(filters.sourceId && { source: filters.sourceId }), page: String(page) })}`;
  return (
    <div className="page-shell">
      <header className="mb-9 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Your knowledge garden</p><h1 className="font-serif text-4xl font-medium tracking-tight md:text-5xl">All Insights</h1><p className="mt-2 font-serif text-muted">{library.total} ideas captured and growing.</p></div></header>
      <form className="surface mb-7 grid gap-3 p-4 md:grid-cols-[1fr_210px_210px_auto]" method="get">
        <label className="flex h-11 items-center gap-2 rounded-lg border border-line bg-white px-3"><Search size={17} className="text-muted" /><input className="w-full bg-transparent text-sm outline-none" name="q" defaultValue={filters.query} placeholder="Search your insights..." /></label>
        <Select name="topic" defaultValue={filters.topicId ?? ""}><option value="">All topics</option>{options.topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</Select>
        <Select name="source" defaultValue={filters.sourceId ?? ""}><option value="">All sources</option>{options.sources.map((source) => <option key={source.id} value={source.id}>{source.title}</option>)}</Select>
        <Button>Filter</Button>
      </form>
      {library.items.length ? <div className="grid gap-4 md:grid-cols-2">{library.items.map((insight) => <article className="surface flex min-h-64 flex-col p-6" key={insight.id}><div className="flex justify-between text-[11px] uppercase tracking-wider text-muted"><span className="flex items-center gap-2"><BookOpen size={14} />{insight.source?.type ?? "Personal"}</span><time>{formatDate(insight.createdAt, { month: "short", day: "numeric" })}</time></div><Link href={`/insights/${insight.id}`} className="mt-5 font-serif text-xl font-medium leading-7 hover:text-violet-700">{insight.title || insight.content.slice(0, 90)}</Link><p className="mt-2 line-clamp-3 font-serif text-sm leading-6 text-muted">{insight.content}</p><div className="mt-4 flex flex-wrap gap-2">{insight.topics.map((topic) => <span className="topic-pill" key={topic.id}>{topic.name}</span>)}</div><div className="mt-auto flex justify-between border-t border-line pt-4 text-xs text-muted"><span>{insight.source?.title ?? "Personal reflection"}</span><span>Review {formatDate(insight.nextReviewAt, { month: "short", day: "numeric" })}</span></div></article>)}</div> : <div className="surface py-20 text-center"><Search className="mx-auto text-violet-400" /><h2 className="mt-4 font-serif text-2xl">No insights found</h2><p className="mt-2 text-sm text-muted">Adjust the filters or capture something new.</p></div>}
      {pages > 1 && <nav className="mt-8 flex justify-center gap-3" aria-label="Pagination">{filters.page > 1 && <Button asChild variant="outline"><Link href={pageHref(filters.page - 1)}><ArrowLeft size={15} />Previous</Link></Button>}<span className="grid place-items-center px-3 text-sm text-muted">{filters.page} / {pages}</span>{filters.page < pages && <Button asChild variant="outline"><Link href={pageHref(filters.page + 1)}>Next<ArrowRight size={15} /></Link></Button>}</nav>}
    </div>
  );
}
