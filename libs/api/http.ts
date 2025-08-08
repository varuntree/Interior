import config from "@/config";

export class ApiClientError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function handle(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = (isJson ? body?.error : body) || `HTTP ${res.status}`;
    throw new ApiClientError(res.status, msg);
  }
  return isJson ? body : { success: true, data: body };
}

/** Client-side (browser) */
export async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(path, { credentials: "include", ...init });
  try {
    return await handle(res);
  } catch (e: any) {
    if (e?.status === 401) {
      // redirect to login on unauthorized
      if (typeof window !== "undefined") window.location.assign(config.auth.loginUrl);
    }
    throw e;
  }
}

/** Server-side (RSC or server code) */
export async function apiFetchServer(path: string, init: RequestInit = {}) {
  const res = await fetch(path, { cache: "no-store", ...init });
  return handle(res);
}