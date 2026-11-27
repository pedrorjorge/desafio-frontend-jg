import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";

export function SearchInput({
  value,
  onSearch,
}: {
  value: string;
  onSearch: (value: string) => void;
}) {
  const [draft, setDraft] = useState({ previous: value, text: value });
  if (draft.previous !== value) setDraft({ previous: value, text: value });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = String(data.get("q") ?? "").trim();
    setDraft({ previous: value, text });
    onSearch(text);
  }

  return (
    <form
      role="search"
      aria-label="Busca de NFTs"
      onSubmit={submit}
      className="flex min-w-0 gap-2"
    >
      <label className="min-w-0 flex-1">
        <span className="sr-only">Buscar NFTs</span>
        <input
          name="q"
          type="search"
          value={draft.text}
          onChange={(event) =>
            setDraft({ previous: value, text: event.currentTarget.value })
          }
          maxLength={100}
          placeholder="Buscar NFTs"
          className="w-full"
        />
      </label>
      <Button type="submit" className="shrink-0">
        Buscar
      </Button>
    </form>
  );
}
