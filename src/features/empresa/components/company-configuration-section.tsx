"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Input } from "@/components/ui/input";
import { HorarioAdminPanel } from "@/features/horario/components/horario-admin-panel";
import { UsuariosInternosPanel } from "@/features/usuario/components/usuarios-internos-panel";
import { updateEmpresaCatalogSettings } from "@/features/empresa/services/empresa-client.service";
import type { Empresa } from "@/features/empresa/types/empresa";

export function CompanyConfigurationSection({
  empresa,
}: {
  empresa: Empresa;
}) {
  const router = useRouter();
  const [tieneCarrito, setTieneCarrito] = useState(empresa.tieneCarrito);
  const [incluirCodigoBarra, setIncluirCodigoBarra] = useState(
    empresa.incluirCodigoBarra ?? false,
  );
  const [pedidosFueraHorario, setPedidosFueraHorario] = useState(
    empresa.pedidosFueraHorario ?? false,
  );
  const [imagenesEnArticulos, setImagenesEnArticulos] = useState(
    empresa.imagenesEnArticulos ?? true,
  );
  const [toleranciaMinDias, setToleranciaMinDias] = useState(
    empresa.toleranciaMinDias?.toString() ?? "",
  );
  const [toleranciaMaxDias, setToleranciaMaxDias] = useState(
    empresa.toleranciaMaxDias?.toString() ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function saveCatalogSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setError(null);
    setNotice(null);

    let minimumDays: number | null;
    let maximumDays: number | null;
    try {
      minimumDays = parseDays(toleranciaMinDias, "El plazo para resaltar");
      maximumDays = parseDays(toleranciaMaxDias, "El plazo para mostrar Consultar");
      if (maximumDays !== null && minimumDays === null) {
        throw new Error(
          "Definí primero los días para resaltar la fecha de actualización.",
        );
      }
      if (
        minimumDays !== null &&
        maximumDays !== null &&
        maximumDays <= minimumDays
      ) {
        throw new Error(
          "El plazo para mostrar Consultar debe ser mayor que el plazo para resaltar la actualización.",
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Revisá los valores de tolerancia ingresados.",
      );
      return;
    }

    setIsSaving(true);
    try {
      await updateEmpresaCatalogSettings(empresa.id, {
        tieneCarrito,
        incluirCodigoBarra,
        pedidosFueraHorario,
        imagenesEnArticulos,
        toleranciaMinDias: minimumDays,
        toleranciaMaxDias: maximumDays,
      });
      setNotice("La configuración del catálogo se guardó correctamente.");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar la configuración del catálogo.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <HorarioAdminPanel empresaId={empresa.id} />
      <UsuariosInternosPanel empresaId={empresa.id} />

      <CollapsibleSection title="Catálogo">
        <form onSubmit={saveCatalogSettings}>
          <fieldset disabled={isSaving} className="space-y-6">
            <p className="text-sm leading-6 text-muted">
              Configurá cómo se presenta el catálogo y cómo se reciben los pedidos.
            </p>

            <div className="space-y-3">
              <CheckboxField
                id="catalog-settings-barcode"
                checked={incluirCodigoBarra}
                onChange={setIncluirCodigoBarra}
                label="Incluir código de barras"
                description="Muestra el código de barras de los artículos en el catálogo."
              />
              <CheckboxField
                id="catalog-settings-outside-hours"
                checked={pedidosFueraHorario}
                onChange={setPedidosFueraHorario}
                label="Permitir pedidos fuera del horario"
                description="Permite recibir pedidos fuera de los horarios de atención configurados."
              />
              <CheckboxField
                id="catalog-settings-orders"
                checked={tieneCarrito}
                onChange={setTieneCarrito}
                label="Catálogo con pedidos"
                description="Permite que los clientes armen pedidos desde el catálogo."
              />
            </div>

            <CollapsibleSection title="Artículos" nested>
              <p className="text-sm leading-6 text-muted">
                Definí cómo se muestran las imágenes, la fecha de actualización y los precios.
              </p>

              <CheckboxField
                id="catalog-settings-article-images"
                checked={imagenesEnArticulos}
                onChange={setImagenesEnArticulos}
                label="Artículos con imagen"
                description="Muestra las imágenes asociadas a los artículos en el catálogo."
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Input
                    id="catalog-update-highlight-days"
                    label="Resaltar actualización después de (días)"
                    type="number"
                    min={0}
                    step={1}
                    value={toleranciaMinDias}
                    onChange={(event) => {
                      setToleranciaMinDias(event.currentTarget.value);
                      setError(null);
                    }}
                    aria-describedby="catalog-update-highlight-help"
                  />
                  <p
                    id="catalog-update-highlight-help"
                    className="mt-2 text-xs leading-5 text-muted"
                  >
                    Al superar este plazo desde la última actualización, se resaltará la fecha de actualización del artículo en el catálogo.
                  </p>
                </div>
                <div>
                  <Input
                    id="catalog-hide-price-days"
                    label="Mostrar «Consultar» después de (días)"
                    type="number"
                    min={0}
                    step={1}
                    value={toleranciaMaxDias}
                    onChange={(event) => {
                      setToleranciaMaxDias(event.currentTarget.value);
                      setError(null);
                    }}
                    aria-describedby="catalog-hide-price-help"
                  />
                  <p
                    id="catalog-hide-price-help"
                    className="mt-2 text-xs leading-5 text-muted"
                  >
                    Al superar este plazo, el precio se reemplazará por «Consultar» en el catálogo. Debe ser mayor que el plazo para resaltar la actualización.
                  </p>
                </div>
              </div>
            </CollapsibleSection>
          </fieldset>

          {error ? (
            <p role="alert" className="mt-5 text-sm text-danger">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="mt-5 text-sm text-muted">
              {notice}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="h-11 rounded-button bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Guardando…" : "Guardar configuración"}
            </button>
          </div>
        </form>
      </CollapsibleSection>
    </div>
  );
}

function parseDays(value: string, label: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;

  const days = Number(normalized);
  if (!Number.isSafeInteger(days) || days < 0) {
    throw new Error(`${label} debe ser un número entero igual o mayor que cero.`);
  }
  return days;
}
