"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { createInsightAction } from "../actions";
import { insightInputSchema } from "../contracts";
import type { ActionState } from "@/features/shared/contracts";
import type { z } from "zod";

export function QuickCapture({ topics, sources }: { topics: Array<{ id: string; name: string }>; sources: Array<{ id: string; title: string }> }) {
  const [open, setOpen] = useState(false);
  const initialCreateState: ActionState<{ id: string }> = { status: "idle" };
  const [state, action, pending] = useActionState(createInsightAction, initialCreateState);
  const handledInsightId = useRef<string | undefined>(undefined);
  const form = useForm<z.input<typeof insightInputSchema>>({
    resolver: zodResolver(insightInputSchema),
    defaultValues: { title: "", content: "", reflection: "", sourceId: "", sourceTitle: "", sourceType: "EXPERIENCE", topicIds: [], newTopics: [] },
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", listener);
    const openCapture = () => setOpen(true);
    window.addEventListener("insightflow:capture", openCapture);
    return () => { window.removeEventListener("keydown", listener); window.removeEventListener("insightflow:capture", openCapture); };
  }, []);
  useEffect(() => {
    const savedInsightId = state.data?.id;
    if (state.status !== "success" || !savedInsightId || handledInsightId.current === savedInsightId) return;
    handledInsightId.current = savedInsightId;
    const frame = window.requestAnimationFrame(() => { setOpen(false); form.reset(); });
    return () => window.cancelAnimationFrame(frame);
  }, [state.status, state.data?.id, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="sage" size="sm"><Plus size={16} /><span className="hidden sm:inline">Insight</span></Button></DialogTrigger>
      <DialogContent>
        <p className="eyebrow">Capture what matters</p><DialogTitle>A new insight</DialogTitle><DialogDescription>Keep it focused. One clear idea is easier to remember and connect.</DialogDescription>
        <form className="mt-6 grid gap-4" onSubmit={form.handleSubmit((_values, event) => {
          if (!(event?.target instanceof HTMLFormElement)) return;
          const formData = new FormData(event.target);
          startTransition(() => action(formData));
        })}>
          <Label>Title <span className="normal-case tracking-normal text-muted">Optional</span><Input {...form.register("title")} placeholder="What did you learn?" />{form.formState.errors.title && <small className="text-danger">{form.formState.errors.title.message}</small>}</Label>
          <Label>In your own words<Textarea {...form.register("content")} rows={5} placeholder="Explain the idea simply..." />{form.formState.errors.content && <small className="text-danger">{form.formState.errors.content.message}</small>}</Label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label>Existing source<Select {...form.register("sourceId")}><option value="">No existing source</option>{sources.map((source) => <option value={source.id} key={source.id}>{source.title}</option>)}</Select></Label>
            <Label>Or create a source<Input {...form.register("sourceTitle")} placeholder="Book, video, experience..." /></Label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2"><Label>Source type<Select {...form.register("sourceType")}>{["BOOK","ARTICLE","VIDEO","PODCAST","COURSE","CONVERSATION","WORK","EXPERIENCE"].map((type) => <option key={type}>{type}</option>)}</Select></Label><Label>Why it matters<Input {...form.register("reflection")} placeholder="A note to your future self" /></Label></div>
          {topics.length > 0 && <fieldset><legend className="mb-2 text-xs font-semibold uppercase tracking-[.1em] text-muted">Topics</legend><div className="flex flex-wrap gap-2">{topics.map((topic) => <label key={topic.id} className="cursor-pointer"><input type="checkbox" value={topic.id} {...form.register("topicIds")} className="peer sr-only" /><span className="inline-flex rounded-full bg-violet-50 px-3 py-2 text-xs text-violet-700 ring-1 ring-transparent peer-checked:bg-violet-100 peer-checked:ring-violet-400">{topic.name}</span></label>)}</div></fieldset>}
          <Label>New topics <span className="normal-case tracking-normal text-muted">Comma-separated</span><Input name="newTopics" placeholder="Learning, Psychology" /></Label>
          {state.status === "error" && state.message && <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-danger">{state.message}</motion.p>}
          <div className="mt-2 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={pending}>{pending ? "Saving..." : <>Save insight <ArrowRight size={16} /></>}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
