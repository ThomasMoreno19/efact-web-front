"use client";

import { useState } from "react";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { useStatusToast } from "@/components/ui/status-toast";
import { updateEmpresaCatalogSettings } from "@/features/empresa/services/empresa-client.service";

export function PedidosFueraHorarioSetting({
  empresaId,
  initialValue,
}: {
  empresaId: number;
  initialValue: boolean;
}) {
  const showStatusToast = useStatusToast();
  const [enabled, setEnabled] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  async function save(value: boolean) {
    if (saving) return;
    const previousValue = enabled;
    setEnabled(value);
    setSaving(true);
    try {
      await updateEmpresaCatalogSettings(empresaId, { pedidosFueraHorario: value });
      showStatusToast("La configuración de pedidos fuera de horario se guardó correctamente.", "success");
    } catch (cause) {
      setEnabled(previousValue);
      showStatusToast(cause instanceof Error ? cause.message : "No se pudo guardar la configuración.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 border-t border-border pt-6">
      <fieldset disabled={saving} className="min-w-0">
        <CheckboxField
          id="schedule-orders-outside-hours"
          checked={enabled}
          onChange={(value) => void save(value)}
          label="Permitir pedidos fuera del horario"
          description="Permite recibir pedidos fuera de los horarios de atención configurados."
        />
      </fieldset>
    </div>
  );
}
