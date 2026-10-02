"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function OpenCaptureButton({ className }: { className?: string }) {
  return <button onClick={() => window.dispatchEvent(new Event("insightflow:capture"))} className={cn("flex h-[70px] w-full items-center rounded-xl border border-line bg-white/75 px-4 text-left font-serif text-muted shadow-sm transition hover:border-violet-200 hover:shadow-md", className)}><span className="mr-5 grid size-13 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-700"><Plus /></span><span>Capture a new insight...</span><kbd className="ml-auto hidden font-sans text-[11px] text-slate-400 sm:block">⌘ K</kbd></button>;
}
