"use client";

import Image from "next/image";
import { useState } from "react";
import Logo from "../../../../public/Logo.png";
import type { Empresa } from "@/features/empresa/types/empresa";
import { getAccessibleImageUrl } from "@/services/image-url";

interface CompanyLogoProps {
  empresa: Pick<Empresa, "nombre" | "logo_url">;
}

export function CompanyLogo({ empresa }: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);
  const source = getAccessibleImageUrl(empresa.logo_url?.trim() ?? null);
  if (!source || hasError) return <LogoPlaceholder />;

  return (
    <Image
      src={source}
      alt={`Logo de ${empresa.nombre}`}
      fill
      unoptimized
      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
      className="object-cover"
      onError={() => setHasError(true)}
    />
  );
}

function LogoPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center bg-field p-8">
      <Image
        src={Logo}
        alt=""
        aria-hidden="true"
        className="h-20 w-20 object-contain opacity-40"
      />
    </div>
  );
}
