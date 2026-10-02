import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";
import { requireUser } from "@/features/auth/service";
import { listTopics } from "@/features/topics/repository";

const accents = ["text-violet-700 bg-violet-50", "text-sage-700 bg-sage-50", "text-sky-700 bg-sky-50", "text-orange-700 bg-orange-50"];

export default async function TopicsPage() {
  const user = await requireUser();
  const topics = await listTopics(user.id);
  return <div className="page-shell"><header className="mb-9"><p className="eyebrow">Connected thinking</p><h1 className="font-serif text-4xl font-medium tracking-tight md:text-5xl">Topics</h1><p className="mt-2 font-serif text-muted">Explore the themes running through your learning.</p></header>{topics.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{topics.map((topic, index) => <article className="surface relative min-h-56 overflow-hidden p-6" key={topic.id}><div className={`grid size-11 place-items-center rounded-xl ${accents[index % accents.length]}`}><Layers3 size={20} /></div><span className="absolute right-6 top-7 text-xs text-muted">{topic.insightCount} insights</span><h2 className="mt-6 font-serif text-2xl">{topic.name}</h2><p className="mt-2 text-sm text-muted">Return to the ideas you’ve collected around this theme.</p><Link href={`/topics/${topic.id}`} className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-sage-700">Explore topic <ArrowRight size={15} /></Link></article>)}</div> : <div className="surface py-20 text-center"><Layers3 className="mx-auto text-sage-500" /><h2 className="mt-4 font-serif text-2xl">No topics yet</h2><p className="mt-2 text-sm text-muted">Add a topic while capturing an insight.</p></div>}</div>;
}
