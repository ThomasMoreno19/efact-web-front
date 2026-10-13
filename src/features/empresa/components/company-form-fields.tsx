import { CheckboxField } from "@/components/ui/checkbox-field";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Input } from "@/components/ui/input";
import { CompanyLogoUploadField } from "@/features/empresa/components/company-logo-upload-field";
import Image from "next/image";
import { ShoppingBag, ShoppingCart, Wallet, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  adminUsername: string;
  onAdminUsernameChange: (value: string) => void;
  adminPassword: string;
  onAdminPasswordChange: (value: string) => void;
  adminUserExists: boolean;
  isLoadingAdminUser: boolean;
  adminUserLoadError: string | null;
  onRetryAdminUserLoad: () => void;
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
  adminUsername,
  onAdminUsernameChange,
  adminPassword,
  onAdminPasswordChange,
  adminUserExists,
  isLoadingAdminUser,
  adminUserLoadError,
  onRetryAdminUserLoad,
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

      <div className="space-y-3">
        <Input
          id="empresa-admin-username"
          label="Nombre de usuario Admin"
          value={adminUsername}
          onChange={(event) => onAdminUsernameChange(event.target.value)}
          autoComplete="username"
          maxLength={255}
          disabled={isLoadingAdminUser}
          required
        />
        <Input
          id="empresa-admin-password"
          label="Contraseña del usuario Admin"
          type="password"
          value={adminPassword}
          onChange={(event) => onAdminPasswordChange(event.target.value)}
          autoComplete="new-password"
          maxLength={72}
          disabled={isLoadingAdminUser}
          required={!adminUserExists}
        />
        {adminUserExists ? (
          <p className="text-xs text-muted">
            Dejá la contraseña vacía para conservar la actual.
          </p>
        ) : null}
        {isLoadingAdminUser ? (
          <p role="status" className="text-xs text-muted">
            Cargando el usuario Admin…
          </p>
        ) : null}
        {adminUserLoadError ? (
          <div role="alert" className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-danger">{adminUserLoadError}</span>
            <button
              type="button"
              onClick={onRetryAdminUserLoad}
              className="font-medium text-foreground underline underline-offset-2"
            >
              Reintentar
            </button>
          </div>
        ) : null}
      </div>

      <CollapsibleSection title="Opciones avanzadas">
        <div className="space-y-4">
          <CheckboxField
            id="empresa-habilitar-excel"
            checked={habilitarExcel}
            onChange={onHabilitarExcelChange}
            icon={
              <Image
                src="/excel.svg"
                alt=""
                aria-hidden="true"
                width={20}
                height={20}
              />
            }
            label="Carga de Excel"
            description="Permite las cargas de datos mediante archivos Excel."
          />

          <fieldset className="space-y-3 rounded-card border border-border p-4">
            <legend className="px-2 text-sm font-semibold">Módulos</legend>
            <div className="space-y-3">
              <ModuleOption
                id="empresa-catalogo-habilitado"
                label="Catálogo"
                description="Activa el módulo de catálogo."
                checked={catalogoHabilitado}
                onChange={onCatalogoHabilitadoChange}
                icon={ShoppingBag}
              />
              <div className="ml-7 border-l border-border pl-3">
                <CheckboxField
                  id="empresa-tiene-carrito"
                  checked={tieneCarrito}
                  onChange={onTieneCarritoChange}
                  icon={
                    <ShoppingCart
                      aria-hidden="true"
                      className="size-5 text-muted"
                    />
                  }
                  label="Carrito de compras"
                  description="Permite que los clientes armen pedidos desde el catálogo."
                />
              </div>
              <ModuleOption
                id="empresa-saldos-habilitados"
                label="Saldo de clientes"
                description="Activa la consulta de saldos."
                checked={saldosHabilitados}
                onChange={onSaldosHabilitadosChange}
                icon={Wallet}
              />
              <ModuleOption
                id="empresa-reparaciones-habilitadas"
                label="Reparación"
                description="Activa la consulta de reparaciones."
                checked={reparacionesHabilitadas}
                onChange={onReparacionesHabilitadasChange}
                icon={Wrench}
              />
            </div>
          </fieldset>
        </div>
      </CollapsibleSection>
    </div>
  );
}

function ModuleOption({
  id,
  label,
  description,
  checked,
  onChange,
  icon: Icon,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: LucideIcon;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 rounded-input border border-border bg-field p-3 text-sm"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-brand"
      />
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted" />
      <span>
        <span className="block font-medium">{label}</span>
        <span className="mt-1 block text-xs text-muted">{description}</span>
      </span>
    </label>
  );
}
