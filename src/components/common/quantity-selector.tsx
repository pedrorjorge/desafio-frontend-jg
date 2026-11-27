import { Button } from "@/components/ui/button";

type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
};

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
}: QuantitySelectorProps) {
  const atMaximum = max !== undefined && value >= max;

  return (
    <div
      role="group"
      aria-label="Quantidade"
      className="inline-flex items-center gap-2"
    >
      <Button
        variant="outline"
        className="min-w-control px-2 text-lg"
        aria-label="Diminuir quantidade"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </Button>
      <output
        className="min-w-9 text-center tabular-nums"
        aria-label="Quantidade atual"
      >
        {value}
      </output>
      <Button
        variant="outline"
        className="min-w-control px-2 text-lg"
        aria-label="Aumentar quantidade"
        disabled={disabled || atMaximum}
        onClick={() => onChange(value + 1)}
      >
        +
      </Button>
    </div>
  );
}
