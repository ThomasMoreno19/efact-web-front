"use client";

import { useState } from "react";
import { Input, type InputProps } from "@/components/ui/input";

type PasswordInputProps = Omit<InputProps, "endAdornment" | "type">;

export function PasswordInput(props: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Input
      {...props}
      type={isVisible ? "text" : "password"}
      autoComplete={props.autoComplete ?? "current-password"}
      endAdornment={
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={isVisible}
          className="flex size-9 items-center justify-center rounded-button text-muted transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-5"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-5"
    >
      <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6 0 9.5 7 9.5 7a16 16 0 0 1-3.1 3.8M6.2 6.2C3.8 7.9 2.5 12 2.5 12s3.5 7 9.5 7a10 10 0 0 0 3.2-.5" />
    </svg>
  );
}
