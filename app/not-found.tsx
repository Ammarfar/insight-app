import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="grid min-h-[70vh] place-items-center px-4"><div className="text-center"><p className="eyebrow">404</p><h1 className="font-serif text-4xl">That insight has wandered off.</h1><p className="my-5 text-muted">Return to your library and keep learning.</p><Button asChild><Link href="/insights">Open insights</Link></Button></div></main>;
}
