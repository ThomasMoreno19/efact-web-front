import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export function CollapsibleSection({
  title,
  children,
  icon,
  nested = false,
}: {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  nested?: boolean;
}) {
  return (
    <details
      className={
        nested
          ? "group/subsection border-t border-border pt-6"
          : "group/section overflow-hidden rounded-card border border-border bg-surface"
      }
    >
      <summary
        className={`flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand [&::-webkit-details-marker]:hidden ${
          nested ? "py-1 text-base" : "p-6 text-lg sm:p-8"
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          {icon ? <span className="shrink-0">{icon}</span> : null}
          <span className="min-w-0 break-words">{title}</span>
        </span>
        <ChevronRight
          aria-hidden="true"
          className={`size-5 shrink-0 text-muted transition-transform ${
            nested
              ? "group-open/subsection:rotate-90"
              : "group-open/section:rotate-90"
          }`}
        />
      </summary>
      <div
        className={
          nested
            ? "space-y-5 pt-4"
            : "border-t border-border px-6 pb-6 pt-6 sm:px-8 sm:pb-8"
        }
      >
        {children}
      </div>
    </details>
  );
}
