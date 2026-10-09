import { CheckboxField } from "@/components/ui/checkbox-field";
import { Input } from "@/components/ui/input";
import { CompanyLogoUploadField } from "@/features/empresa/components/company-logo-upload-field";

interface CompanyFormFieldsProps {
  nombre: string;
  onNombreChange: (value: string) => void;
  slug: string;
  onSlugChange: (value: string) => void;
  telefono: string;
  onTelefonoChange: (value: string) => void;
  ubicacion: string;
  onUbicacionChange: (value: string) => void;
  currentLogoUrl: string | null;
  logoFile: File | null;
  onLogoFileChange: (file: File | null) => void;
  tieneCarrito: boolean;
  onTieneCarritoChange: (checked: boolean) => void;
  catalogoHabilitado: boolean;
  onCatalogoHabilitadoChange: (checked: boolean) => void;
  saldosHabilitados: boolean;
  onSaldosHabilitadosChange: (checked: boolean) => void;
  reparacionesHabilitadas: boolean;
  onReparacionesHabilitadasChange: (checked: boolean) => void;
  habilitarExcel: boolean;
  onHabilitarExcelChange: (checked: boolean) => void;
}

export function CompanyFormFields({
  nombre,
  onNombreChange,
  slug,
  onSlugChange,
  telefono,
  onTelefonoChange,
  ubicacion,
  onUbicacionChange,
  currentLogoUrl,
  logoFile,
  onLogoFileChange,
  tieneCarrito,
  onTieneCarritoChange,
  catalogoHabilitado,
  onCatalogoHabilitadoChange,
  saldosHabilitados,
  onSaldosHabilitadosChange,
  reparacionesHabilitadas,
  onReparacionesHabilitadasChange,
  habilitarExcel,
  onHabilitarExcelChange,
}: CompanyFormFieldsProps) {
  return (
    <div className="space-y-4">
      <Input
        id="empresa-nombre"
        label="Nombre de la empresa"
        value={nombre}
        onChange={(event) => onNombreChange(event.target.value)}
        maxLength={100}
        required
      />
      <Input
        id="empresa-slug"
        label="Slug de la URL"
        value={slug}
        onChange={(event) => onSlugChange(event.target.value)}
        placeholder="nombre-de-empresa"
        maxLength={100}
        required
      />
      <Input
        id="empresa-telefono"
        label="Teléfono de WhatsApp"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={telefono}
        onChange={(event) => onTelefonoChange(event.target.value)}
        placeholder="+54 9 3535 12-3456"
        maxLength={18}
      />
      <Input
        id="empresa-ubicacion"
        label="Ubicación"
        value={ubicacion}
        onChange={(event) => onUbicacionChange(event.target.value)}
        placeholder="Antonio Sobral 299, Villa María"
        maxLength={50}
      />
      <CompanyLogoUploadField
        currentLogoUrl={currentLogoUrl}
        file={logoFile}
        onFileChange={onLogoFileChange}
      />

      <CheckboxField
        id="empresa-tiene-carrito"
        checked={tieneCarrito}
        onChange={onTieneCarritoChange}
        label="Carrito de compras"
        description="Permite que los clientes armen pedidos desde el catálogo."
      />
      <CheckboxField
        id="empresa-catalogo-habilitado"
        checked={catalogoHabilitado}
        onChange={onCatalogoHabilitadoChange}
        label="Módulo de catálogo"
        description="Muestra el catálogo de esta empresa en el sidebar."
      />
      <CheckboxField
        id="empresa-saldos-habilitados"
        checked={saldosHabilitados}
        onChange={onSaldosHabilitadosChange}
        label="Módulo de saldos"
        description="Muestra la consulta de saldos de esta empresa en el sidebar."
      />
      <CheckboxField
        id="empresa-reparaciones-habilitadas"
        checked={reparacionesHabilitadas}
        onChange={onReparacionesHabilitadasChange}
        label="Módulo de reparaciones"
        description="Muestra reparaciones de esta empresa en el sidebar."
      />
      <CheckboxField
        id="empresa-habilitar-excel"
        checked={habilitarExcel}
        onChange={onHabilitarExcelChange}
        label="Habilitar cargas Excel"
        description="Permite las cargas de datos mediante archivos Excel."
      />
    </div>
  );
}
