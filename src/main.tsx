import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";

import { mocksEnabled } from "@/lib/env";
import { queryClient } from "@/lib/query-client";
import { observeSessionFailures } from "@/lib/session";
import { router } from "@/routes/router";
import "@/styles/globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento raiz da aplicação não encontrado.");
}

const root = createRoot(rootElement);

async function start() {
  if (mocksEnabled) {
    const { startMocks } = await import("@/mocks/browser");
    await startMocks();
  }

  observeSessionFailures();

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void start().catch((error: unknown) => {
  console.error(error);
  root.render(<p role="alert">Não foi possível iniciar a aplicação.</p>);
});
