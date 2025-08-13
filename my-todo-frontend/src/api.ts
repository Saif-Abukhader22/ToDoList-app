// src/api.ts
import axios, { AxiosHeaders, type InternalAxiosRequestConfig} from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  const url = config.url ?? "";
  const isAuthCall = url.startsWith("/auth/");

  if (token && !isAuthCall) {
    // ensure we have an AxiosHeaders instance
    const headers = config.headers instanceof AxiosHeaders
      ? config.headers
      : new AxiosHeaders(config.headers);

    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});
