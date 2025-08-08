type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export function withMethods(handlers: Partial<Record<HttpMethod, Function>>) {
  return async (req: Request) => {
    const method = (req.method || "GET").toUpperCase() as HttpMethod;
    const handler = handlers[method];
    if (!handler) {
      return new Response(null, { status: 405, headers: { Allow: Object.keys(handlers).join(",") } });
    }
    try {
      return await handler(req);
    } catch (e: any) {
      const message = e?.message || "Internal Server Error";
      const status = e?.status && Number.isInteger(e.status) ? e.status : 500;
      return Response.json({ success: false, error: message }, { status });
    }
  };
}