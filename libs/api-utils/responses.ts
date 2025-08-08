export function ok<T>(data: T, init: ResponseInit = {}) {
  return Response.json({ success: true, data }, { status: 200, ...init });
}
export function created<T>(data: T, init: ResponseInit = {}) {
  return Response.json({ success: true, data }, { status: 201, ...init });
}
export function badRequest(message = "Invalid request") {
  return Response.json({ success: false, error: message }, { status: 400 });
}
export function unauthorized(message = "Unauthorized") {
  return Response.json({ success: false, error: message }, { status: 401 });
}
export function forbidden(message = "Forbidden") {
  return Response.json({ success: false, error: message }, { status: 403 });
}
export function serverError(message = "Internal Server Error") {
  return Response.json({ success: false, error: message }, { status: 500 });
}