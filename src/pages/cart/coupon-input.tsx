import { useId, type FormEvent } from "react";

import { Button } from "@/components/ui/button";

export function CouponInput({
  code,
  busy,
  error,
  onApply,
  onRemove,
}: {
  code: string | null;
  busy: boolean;
  error?: string;
  onApply: (code: string) => void;
  onRemove: () => void;
}) {
  const id = useId();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(
      new FormData(event.currentTarget).get("coupon") ?? "",
    ).trim();
    if (value) onApply(value);
  }

  return (
    <div className="grid gap-2">
      <form onSubmit={submit} className="grid gap-2">
        <label htmlFor={id} className="text-sm font-semibold">
          Código promocional
        </label>
        <div className="flex min-w-0 flex-wrap gap-2">
          <input
            id={id}
            key={code ?? "none"}
            name="coupon"
            maxLength={40}
            required
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            placeholder="Digite o código"
            defaultValue={code ?? ""}
            className="min-w-0 flex-[1_1_8rem] font-normal aria-invalid:border-destructive"
          />
          <Button type="submit" disabled={busy}>
            Aplicar
          </Button>
        </div>
        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </form>
      {code && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>
            Aplicado: <strong>{code}</strong>
          </span>
          <Button variant="outline" disabled={busy} onClick={onRemove}>
            Remover cupom
          </Button>
        </div>
      )}
    </div>
  );
}
