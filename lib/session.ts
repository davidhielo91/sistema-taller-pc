import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionPayload } from "./definitions";

function getEncodedKey(): Uint8Array {
  const key = process.env.SESSION_SECRET;
  if (!key) {
    throw new Error(
      "SESSION_SECRET no está definida. Debe configurarse en el archivo .env o en las variables de entorno."
    );
  }
  if (
    process.env.NODE_ENV === "production" &&
    key === "cambiar-por-un-secreto-seguro-en-produccion"
  ) {
    throw new Error(
      "SESSION_SECRET tiene el valor de relleno predeterminado. " +
        "Genere un secreto seguro con: openssl rand -base64 32"
    );
  }
  return new TextEncoder().encode(key);
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey());
}

export async function decrypt(
  session: string | undefined = ""
): Promise<SessionPayload | undefined> {
  try {
    const { payload } = await jwtVerify(session, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return undefined;
  }
}

export async function createSession(userId: string, rol: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, rol, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
