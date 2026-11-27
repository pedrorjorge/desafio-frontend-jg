import { isAxiosError, isCancel } from "axios";

import { OlderSnapshot } from "./live-versions";

export function retryNftRead(failureCount: number, error: unknown) {
  if (error instanceof OlderSnapshot) return failureCount < 1;
  if (failureCount >= 1 || isCancel(error) || !isAxiosError(error))
    return false;

  const status = error.response?.status;
  if (status !== undefined)
    return status >= 500 || status === 408 || status === 429;

  return ["ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT"].includes(
    error.code ?? "",
  );
}

export const nftQueryPolicy = {
  staleTime: 30_000,
  gcTime: 5 * 60_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  retry: retryNftRead,
  retryDelay: 750,
};
