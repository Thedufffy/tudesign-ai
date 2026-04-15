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