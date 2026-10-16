import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Marks content that is not final. Visible on purpose so it gets replaced. */
export function Ph({
  children = "Placeholder",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "hud inline-flex items-center border border-dashed border-clay-deep px-1.5 py-[3px] text-clay-deep",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Tiny technical caption, Endfield-style. */
export function Hud({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("hud", className)}>{children}</span>;
}

/**
 * Flat full-width section strip, the equivalent of Endfield's yellow
 * "LORE" bar: a solid colour band with a small illustration and the
 * section name. Marks the boundary between stages.
 */
export function Banner({
  label,
  title,
  art,
  id,
  tone = "clay",
}: {
  label: string;
  title: string;
  art: string;
  id?: string;
  tone?: "clay" | "ink" | "manilla";
}) {
  return (
    <div
      id={id}
      className={cn(
        "relative flex items-center gap-6 overflow-hidden px-6 py-5 md:px-12",
        tone === "clay" && "bg-clay text-ink",
        tone === "ink" && "bg-ink text-paper",
        tone === "manilla" && "bg-manilla text-ink",
      )}
    >
      <Image
        src={art}
        alt=""
        width={96}
        height={96}
        className={cn(
          "size-16 shrink-0 object-contain md:size-20",
          tone === "ink" ? "invert" : "mix-blend-multiply",
        )}
      />
      <div className="min-w-0">
        <Hud className="block opacity-70">{label}</Hud>
        <h2 className="font-display text-4xl leading-none md:text-5xl">{title}</h2>
      </div>
      {/* corner ticks */}
      <span aria-hidden className="absolute right-3 top-3 size-2 border-r border-t border-current opacity-50" />
      <span aria-hidden className="absolute bottom-3 right-3 size-2 border-b border-r border-current opacity-50" />
    </div>
  );
}

/** Header block for inner pages. */
export function PageHead({
  crumb,
  title,
  lede,
  art,
  children,
}: {
  crumb: string;
  title: string;
  lede?: string;
  art: string;
  children?: ReactNode;
}) {
  return (
    <header className="relative border-b border-ink/15 bg-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-[1fr_auto] md:items-end md:px-12 md:py-20">
        <div>
          <Hud className="text-ink-faint">The Fable Club / {crumb}</Hud>
          <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.75rem,1.7rem+4.6vw,5.5rem)] leading-[0.98] tracking-tight">
            {title}
          </h1>
          {lede && (
            <p className="mt-6 max-w-[56ch] font-serif text-lg leading-relaxed text-ink-soft">
              {lede}
            </p>
          )}
          {children}
        </div>
        <Image
          src={art}
          alt=""
          width={220}
          height={220}
          className="hidden size-44 object-contain md:block lg:size-56"
        />
      </div>
    </header>
  );
}

/** Corner brackets for framed panels. */
export function Frame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {children}
      <span aria-hidden className="pointer-events-none absolute left-0 top-0 size-3 border-l border-t border-current" />
      <span aria-hidden className="pointer-events-none absolute right-0 top-0 size-3 border-r border-t border-current" />
      <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 size-3 border-b border-l border-current" />
      <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 size-3 border-b border-r border-current" />
    </div>
  );
}
