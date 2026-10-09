interface CreateCompanyCardProps {
  onClick: () => void;
}

export function CreateCompanyCard({ onClick }: CreateCompanyCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-card border border-dashed border-brand/60 bg-surface/50 p-6 text-center text-brand transition hover:border-brand hover:bg-brand/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span className="flex size-14 items-center justify-center rounded-pill border border-brand/60">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="size-6"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <span className="text-base font-semibold">Agregar una empresa</span>
    </button>
  );
}
