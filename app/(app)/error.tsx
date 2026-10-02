"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="page-shell"><div className="surface mx-auto max-w-xl p-10 text-center"><p className="eyebrow">Something went wrong</p><h1 className="font-serif text-3xl">We couldn’t load your learning space.</h1><p className="my-5 text-sm text-muted">Your data is safe. Try the request again.</p><Button onClick={reset}>Try again</Button></div></div>;
}
