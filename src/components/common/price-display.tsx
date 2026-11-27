export function PriceDisplay({ amount }: { amount: string }) {
  return (
    <span className="font-display font-bold break-words text-primary tabular-nums">
      {amount.replace(".", ",")} ETH
    </span>
  );
}
