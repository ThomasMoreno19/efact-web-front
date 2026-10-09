interface CheckboxFieldProps {
  checked: boolean;
  description: string;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
}

export function CheckboxField({
  checked,
  description,
  id,
  label,
  onChange,
}: CheckboxFieldProps) {
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
      <span>
        <span className="block font-medium">{label}</span>
        <span className="mt-1 block text-xs text-muted">{description}</span>
      </span>
    </label>
  );
}
