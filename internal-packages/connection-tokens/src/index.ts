import * as jose from "jose";
import { z } from "zod";

import { SimpleWebhookSchema } from "@socketless/shared";

import { env } from "../env";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export const TokenPayloadSchema = z.object({
  identifier: z.string(),
  projectId: z.number(),
  clientId: z.string(),
  feeds: z.array(z.string()),
  webhook: SimpleWebhookSchema.optional(),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

export async function createToken(payload: TokenPayload) {
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" }) // Algorithm to be used
    .setIssuedAt() // Set issued at time
    .setExpirationTime("2h") // Set expiration time
    .sign(secret);
}

export class InvalidTokenPayloadContents extends Error {
  public errors: z.ZodError;

  constructor(errors: z.ZodError) {
    super("Invalid token payload contents");
    this.name = "InvalidTokenPayloadContents";
    this.errors = errors;
  }
}

export async function verifyToken(token: string) {
  const { payload } = await jose.jwtVerify<TokenPayload>(token, secret);

  const parsedPayload = await TokenPayloadSchema.safeParseAsync(payload);

  if (!parsedPayload.success) {
    throw new InvalidTokenPayloadContents(parsedPayload.error);
  }

  return payload;
}
