import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "./session";
import { prisma } from "./prisma";

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    redirect("/login");
  }

  return { isAuth: true, userId: session.userId, rol: session.rol };
});

export const getUser = cache(async () => {
  const session = await verifySession();

  try {
    const user = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: { id: true, nombre: true, email: true, rol: true },
    });
    return user;
  } catch {
    return null;
  }
});
