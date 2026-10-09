import type {
  HTMLInputTypeAttribute,
  InputHTMLAttributes,
  ReactNode,
} from "react";

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "id" | "type"
> & {
  className?: string;
  endAdornment?: ReactNode;
  endAdornmentPadding?: "compact" | "normal";
  id: string;
  label: string;
  type?: HTMLInputTypeAttribute;
};

export function Input({
  className,
  endAdornment,
  endAdornmentPadding = "normal",
  id,
  label,
  type = "text",
  ...inputProps
}: InputProps) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>

      <div className="relative">
        <input
          {...inputProps}
          id={id}
          type={type}
          className={`h-12 w-full rounded-input border border-border bg-field px-4 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/15 ${endAdornment ? (endAdornmentPadding === "compact" ? "pr-10" : "pr-12") : ""} ${className ?? ""}`}
        />
        {endAdornment ? (
          <div className="absolute inset-y-0 right-2 flex items-center">
            {endAdornment}
          </div>
        ) : null}
      </div>
    </div>
  );
}
