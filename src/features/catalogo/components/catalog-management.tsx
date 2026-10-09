"use client";

import { useState } from "react";
import { ArticuloAdminPanel } from "@/features/articulo/components/articulo-admin-panel";
import { MarcaAdminPanel } from "@/features/marca/components/marca-admin-panel";
import { ProveedorAdminPanel } from "@/features/proveedor/components/proveedor-admin-panel";
import { RubroAdminPanel } from "@/features/rubro/components/rubro-admin-panel";
import { UbicacionAdminPanel } from "@/features/ubicacion/components/ubicacion-admin-panel";
import { CATALOGO_LISTAS } from "@/features/catalogo/types/catalogo-admin";
import type { CatalogRecordResource } from "@/services/catalog-record-resources";

export function CatalogManagement({ empresaId }: { empresaId: number }) {
  const [activeResource, setActiveResource] =
    useState<CatalogRecordResource | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const activeLabel =
    CATALOGO_LISTAS.find((item) => item.id === activeResource)?.label ??
    "Mostrar catálogo";

  return (
    <section className="rounded-card border border-border bg-surface p-5 sm:p-8">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{activeLabel}</h2>
        {total !== null ? (
          <p className="text-sm text-muted">
            {total.toLocaleString("es-AR")} {total === 1 ? "registro" : "registros"}
          </p>
        ) : null}
      </div>
      <nav
        aria-label="Dominios de catálogo"
        className="mt-5 flex flex-wrap gap-2"
      >
        {CATALOGO_LISTAS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={activeResource === item.id}
            onClick={() => {
              setActiveResource(item.id);
              setTotal(null);
            }}
            className={`h-10 rounded-button border px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              activeResource === item.id
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border text-foreground hover:bg-surface-raised"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {activeResource ? (
        <div className="mt-5">
          {activeResource === "articulos" ? (
            <ArticuloAdminPanel empresaId={empresaId} onTotalChange={setTotal} />
          ) : activeResource === "marcas" ? (
            <MarcaAdminPanel empresaId={empresaId} onTotalChange={setTotal} />
          ) : activeResource === "proveedores" ? (
            <ProveedorAdminPanel empresaId={empresaId} onTotalChange={setTotal} />
          ) : activeResource === "rubros" ? (
            <RubroAdminPanel empresaId={empresaId} onTotalChange={setTotal} />
          ) : (
            <UbicacionAdminPanel empresaId={empresaId} onTotalChange={setTotal} />
          )}
        </div>
      ) : null}
    </section>
  );
}
