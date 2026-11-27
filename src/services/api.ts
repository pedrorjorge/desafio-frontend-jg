import axios from "axios";
import { apiBaseUrl } from "@/lib/env";

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10_000,
  paramsSerializer: { indexes: null },
});
