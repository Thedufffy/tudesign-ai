import { cookies } from "next/headers";

export type PortalUser = {
  email: string;
  role: "admin" | "client";
  modules: string[];
};

const SESSION_COOKIE = "tudesign_admin";

export async function getPortalUser(): Promise<PortalUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;

  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as PortalUser;

    if (!user?.email || !user?.role || !Array.isArray(user?.modules)) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function hasModuleAccess(moduleName: string) {
  const user = await getPortalUser();

  if (!user) return false;
  if (user.role === "admin") return true;

  return user.modules.includes(moduleName);
}

export async function clearPortalSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/* ------------------------------------------------------------------ */
/* Compatibility layer for old fashion API routes */
/* ------------------------------------------------------------------ */

export async function clearFashionSession() {
  await clearPortalSession();
}

export async function setFashionSession(user: {
  email: string;
  role?: "admin" | "client";
  modules?: string[];
}) {
  const cookieStore = await cookies();

  const sessionUser: PortalUser = {
    email: user.email,
    role: user.role ?? "client",
    modules: user.modules ?? ["fashion"],
  };

  cookieStore.set(SESSION_COOKIE, JSON.stringify(sessionUser), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return sessionUser;
}

/**
 * Old routes expect a "fashion session user id".
 * In the new system the session stores the user's email.
 * We return email here and handle email/id compatibility in fashion-store.ts.
 */
export async function getFashionSessionUserId() {
  const user = await getPortalUser();
  return user?.email ?? null;
}