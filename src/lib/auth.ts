import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload } from "@/types/auth";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function createSession(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifySession(
  token: string
): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as SessionPayload;
}
