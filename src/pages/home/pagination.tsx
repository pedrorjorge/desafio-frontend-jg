import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const start = Math.max(1, Math.min(page - 1, totalPages - 2));
  const pages = Array.from(
    { length: Math.min(3, totalPages) },
    (_, index) => start + index,
  );

  return (
    <nav
      aria-label="Paginação do catálogo"
      className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-end"
    >
      <Button
        variant="outline"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ‹
      </Button>
      {pages.map((number) => (
        <Button
          key={number}
          variant={number === page ? "default" : "outline"}
          aria-current={number === page ? "page" : undefined}
          aria-label={`Página ${number}`}
          onClick={() => {
            if (number !== page) onPageChange(number);
          }}
        >
          {number}
        </Button>
      ))}
      <Button
        variant="outline"
        aria-label="Próxima página"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        ›
      </Button>
    </nav>
  );
}
