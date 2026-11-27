import { useId, type ComponentProps } from "react";
import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";

import { readApiError } from "@/services/auth";

type FieldProps = ComponentProps<"input"> & { label: string; error?: string };

export function AccountField({ label, error, ...props }: FieldProps) {
  const id = useId();

  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full min-w-0 aria-invalid:border-destructive"
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function applyApiFormErrors<T extends FieldValues>(
  error: unknown,
  fields: FieldPath<T>[],
  setError: UseFormSetError<T>,
) {
  const problem = readApiError(error);
  let focused = false;
  for (const field of fields) {
    const message = problem?.fields?.[field];
    if (message) {
      setError(field, { type: "server", message }, { shouldFocus: !focused });
      focused = true;
    }
  }
  if (!focused)
    setError("root.server", {
      message: problem?.message ?? "Não foi possível salvar. Tente novamente.",
    });
}
