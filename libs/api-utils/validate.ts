// libs/api-utils/validate.ts
import { z } from "zod";
import { fail } from "./responses";

export function validate<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown
): { ok: true; data: z.infer<TSchema> } | { ok: false; res: Response } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues.map(i => i.message).join("; ");
    return { ok: false, res: fail(400, 'VALIDATION_ERROR', message, result.error.flatten()) };
  }
  return { ok: true, data: result.data };
}

export function safeParseJson<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  jsonString: string
): { success: true; data: z.infer<TSchema> } | { success: false; error: z.ZodError } {
  try {
    const parsed = JSON.parse(jsonString);
    const result = schema.safeParse(parsed);
    return result;
  } catch (err) {
    // Return a ZodError-like object for JSON parse errors
    return {
      success: false,
      error: new z.ZodError([
        {
          code: "custom",
          message: "Invalid JSON",
          path: [],
        },
      ]),
    };
  }
}

// Convenience: parse JSON body of a Request using a Zod schema
export async function validateRequest<TSchema extends z.ZodTypeAny>(
  req: Request,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw fail(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten())
  }
  return parsed.data as z.infer<TSchema>
}
