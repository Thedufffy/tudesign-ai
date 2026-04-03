import { cookies } from "next/headers";

const FASHION_SESSION_KEY = "fashion_user_id";

export async function setFashionSession(userId: string) {
  const cookieStore = await cookies();

  cookieStore.set(FASHION_SESSION_KEY, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearFashionSession() {
  const cookieStore = await cookies();

  cookieStore.set(FASHION_SESSION_KEY, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getFashionSessionUserId() {
  const cookieStore = await cookies();
  return cookieStore.get(FASHION_SESSION_KEY)?.value || null;
}