import { z } from "zod";
import { badRequest } from "./responses";

export function validate<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown
): { ok: true; data: z.infer<TSchema> } | { ok: false; res: Response } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues.map(i => i.message).join("; ");
    return { ok: false, res: badRequest(message) };
  }
  return { ok: true, data: result.data };
}