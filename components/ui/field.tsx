import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn("h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100", className)} {...props} />;
}
export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn("w-full resize-y rounded-lg border border-line bg-white px-3 py-3 font-serif text-sm leading-6 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100", className)} {...props} />;
}
export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("grid gap-2 text-xs font-semibold uppercase tracking-[.1em] text-slate-600", className)} {...props} />;
}

type SelectProps = React.ComponentProps<"select"> & {
  containerClassName?: string;
};

export function Select({ className, containerClassName, children, ...props }: SelectProps) {
  return (
    <span className={cn("relative block", containerClassName)}>
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-lg border border-line bg-white/90 px-3 pr-10 text-sm font-normal normal-case tracking-normal text-ink shadow-[0_1px_2px_rgba(24,34,56,0.04)] outline-none transition hover:border-sage-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-muted",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-sage-600" />
    </span>
  );
}
