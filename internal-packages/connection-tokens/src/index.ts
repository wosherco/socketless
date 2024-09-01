import * as jose from "jose";

import { env } from "../env";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface TokenPayload {
  identifier: string;
  projectId: number;
  webhook?: {
    url: string;
    options: {
      sendOnConnect: boolean;
      sendOnMessage: boolean;
      sendOnDisconnect: boolean;
    };
  };
}

export async function createToken(payload: TokenPayload) {
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" }) // Algorithm to be used
    .setIssuedAt() // Set issued at time
    .setExpirationTime("2h") // Set expiration time
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jose.jwtVerify<TokenPayload>(token, secret);

  return payload;
}
