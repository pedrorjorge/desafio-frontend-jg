import Decimal from "decimal.js";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import type { CatalogFiltersValue } from "@/routes/catalog-search";
import { catalogCategories } from "@/types/api";

import { categoryLabels } from "./catalog-labels";

const availabilityValues = [
  { value: "", label: "Todas as edições" },
  { value: "true", label: "Com edição disponível" },
  { value: "false", label: "Com edição esgotada" },
];

type FilterProps = {
  value: CatalogFiltersValue;
  onApply: (filters: CatalogFiltersValue) => void;
};

function FilterForm({ value, onApply }: FilterProps) {
  const [rangeError, setRangeError] = useState(false);
  const [clearCount, setClearCount] = useState(0);
  const initial = clearCount ? {} : value;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const min = String(data.get("minPrice") ?? "").replace(",", ".");
    const max = String(data.get("maxPrice") ?? "").replace(",", ".");
    if (min && max && new Decimal(min).gt(max)) {
      setRangeError(true);
      return;
    }

    setRangeError(false);
    const category = catalogCategories.filter((item) =>
      data.getAll("category").includes(item),
    );
    const available = data.get("available");
    onApply({
      category: category.length ? category : undefined,
      minPrice: min ? new Decimal(min).toFixed() : undefined,
      maxPrice: max ? new Decimal(max).toFixed() : undefined,
      available:
        available === "true" ? true : available === "false" ? false : undefined,
      featured: data.get("featured") ? true : undefined,
    });
  }

  return (
    <form key={clearCount} onSubmit={submit} className="grid gap-5">
      <fieldset className="grid gap-2">
        <legend className="mb-3 font-semibold">Categorias</legend>
        {catalogCategories.map((category) => (
          <label
            key={category}
            className="flex min-h-9 items-center gap-3 text-sm text-muted-foreground"
          >
            <input
              type="checkbox"
              name="category"
              value={category}
              defaultChecked={initial.category?.includes(category)}
              className="size-4 accent-primary"
            />
            {categoryLabels[category]}
          </label>
        ))}
      </fieldset>
      <fieldset className="grid gap-3 border-t border-border pt-3">
        <legend className="font-semibold">Faixa de preço em ETH</legend>
        <label className="grid gap-1 text-sm text-muted-foreground">
          Mínimo
          <input
            name="minPrice"
            inputMode="decimal"
            pattern="[0-9]{1,18}([.,][0-9]{1,18})?"
            defaultValue={initial.minPrice}
            placeholder="0,00"
            className="w-full min-w-0"
          />
        </label>
        <label className="grid gap-1 text-sm text-muted-foreground">
          Máximo
          <input
            name="maxPrice"
            inputMode="decimal"
            pattern="[0-9]{1,18}([.,][0-9]{1,18})?"
            defaultValue={initial.maxPrice}
            placeholder="0,50"
            className="w-full min-w-0"
          />
        </label>
        {rangeError && (
          <p role="alert" className="text-sm text-destructive">
            O preço máximo deve ser maior ou igual ao mínimo.
          </p>
        )}
      </fieldset>
      <label className="grid gap-2 text-sm font-semibold">
        Disponibilidade
        <select
          name="available"
          defaultValue={
            initial.available === undefined ? "" : String(initial.available)
          }
          className="w-full min-w-0 font-normal"
        >
          {availabilityValues.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-h-9 items-center gap-3 text-sm text-muted-foreground">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={initial.featured === true}
          className="size-4 accent-primary"
        />
        Somente destaques
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Aplicar filtros</Button>
        <Button
          variant="outline"
          onClick={() => {
            setClearCount((count) => count + 1);
            setRangeError(false);
            onApply({});
          }}
        >
          Limpar
        </Button>
      </div>
    </form>
  );
}

export function CatalogFilters({ value, onApply }: FilterProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const filterKey = JSON.stringify(value);
  const [resetCount, setResetCount] = useState(0);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");
    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) dialog.current?.close();
    }
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  function showFilters() {
    setResetCount((count) => count + 1);
    dialog.current?.showModal();
  }

  return (
    <>
      <aside
        aria-label="Filtros do catálogo"
        className="hidden h-fit rounded-panel border border-border bg-card p-5 lg:block"
      >
        <FilterForm key={filterKey} value={value} onApply={onApply} />
      </aside>
      <div className="lg:hidden">
        <Button
          ref={trigger}
          variant="outline"
          aria-haspopup="dialog"
          aria-controls="catalog-filters-drawer"
          onClick={showFilters}
        >
          Filtros
        </Button>
        <dialog
          id="catalog-filters-drawer"
          ref={dialog}
          aria-labelledby="catalog-filters-title"
          onClose={() => {
            if (trigger.current?.getClientRects().length)
              trigger.current.focus();
            else
              document
                .getElementById("catalog-title")
                ?.focus({ preventScroll: true });
          }}
          className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-panel border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-foreground backdrop:bg-black/65 lg:hidden"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2
              id="catalog-filters-title"
              className="font-display text-xl font-bold"
            >
              Filtros
            </h2>
            <Button variant="outline" onClick={() => dialog.current?.close()}>
              Fechar
            </Button>
          </div>
          <FilterForm
            key={`${filterKey}:${resetCount}`}
            value={value}
            onApply={(filters) => {
              onApply(filters);
              dialog.current?.close();
            }}
          />
        </dialog>
      </div>
    </>
  );
}
