"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { initialActionState } from "@/features/shared/contracts";
import { updateInsightAction } from "../actions";
import type { InsightDetail } from "../contracts";

export function InsightEditor({ insight, topics, sources }: { insight: InsightDetail; topics: Array<{ id: string; name: string }>; sources: Array<{ id: string; title: string }> }) {
  const [state, action, pending] = useActionState(updateInsightAction.bind(null, insight.id), initialActionState);
  return (
    <form action={action} className="grid gap-5">
      <Label>Title<Input name="title" defaultValue={insight.title ?? ""} /></Label>
      <Label>In your own words<Textarea name="content" rows={7} required defaultValue={insight.content} /></Label>
      <Label>Why it matters<Textarea name="reflection" rows={3} defaultValue={insight.reflection ?? ""} /></Label>
      <div className="grid gap-4 sm:grid-cols-2"><Label>Source<Select name="sourceId" defaultValue={insight.source?.id ?? ""}><option value="">No source</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.title}</option>)}</Select></Label><Label>Or create source<Input name="sourceTitle" placeholder="New source title" /></Label></div>
      <Label>New source type<Select name="sourceType" defaultValue="EXPERIENCE">{["BOOK","ARTICLE","VIDEO","PODCAST","COURSE","CONVERSATION","WORK","EXPERIENCE"].map((type) => <option key={type}>{type}</option>)}</Select></Label>
      <fieldset><legend className="mb-2 text-xs font-semibold uppercase tracking-[.1em] text-muted">Topics</legend><div className="flex flex-wrap gap-2">{topics.map((topic) => <label key={topic.id} className="cursor-pointer"><input className="peer sr-only" type="checkbox" name="topicIds" value={topic.id} defaultChecked={insight.topics.some((current) => current.id === topic.id)} /><span className="inline-flex rounded-full bg-violet-50 px-3 py-2 text-xs text-violet-700 ring-1 ring-transparent peer-checked:bg-violet-100 peer-checked:ring-violet-400">{topic.name}</span></label>)}</div></fieldset>
      <Label>New topics <span className="normal-case tracking-normal text-muted">Comma-separated</span><Input name="newTopics" /></Label>
      {state.message && <p className={state.status === "error" ? "text-sm text-danger" : "text-sm text-sage-700"}>{state.message}</p>}
      <Button className="w-fit" disabled={pending}><Save size={16} />{pending ? "Saving..." : "Save changes"}</Button>
    </form>
  );
}
