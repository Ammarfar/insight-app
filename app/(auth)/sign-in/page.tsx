import { redirect } from "next/navigation";
import { Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { signInWithGoogle } from "@/features/auth/actions";
import { isGoogleSsoEnabled } from "@/features/auth/config";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  if (!isGoogleSsoEnabled()) redirect("/");
  const session = await auth();
  if (session?.user) redirect("/");
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <section className="surface w-full max-w-md p-8 text-center md:p-10">
        <div className="mx-auto mb-6 grid size-14 place-items-center rounded-full bg-sage-100 text-sage-700"><Leaf fill="currentColor" /></div>
        <p className="eyebrow">Your knowledge, remembered</p>
        <h1 className="font-serif text-4xl font-medium tracking-tight">Welcome to InsightFlow</h1>
        <p className="mt-4 font-serif leading-7 text-muted">Capture what you learn, reconnect the ideas, and return before they fade.</p>
        <form action={signInWithGoogle} className="mt-8"><Button size="lg" className="w-full"><Sparkles size={18} />Continue with Google</Button></form>
        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted"><ShieldCheck size={14} />Your Google Drive is used only for your backups.</p>
      </section>
    </main>
  );
}
