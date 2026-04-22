import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export type FashionUser = {
  id: string;
  email: string;
  name: string;
  password?: string;
  company?: string;
  role: "admin" | "client";
  modules: string[];
  credits: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastGeneratedAt?: string;
};

export type FashionGenerationLog = {
  id: string;
  userEmail: string;
  createdAt: string;
  creditsUsed: number;
  resultCount: number;
  preset?: string;
  locale?: string;
  country?: string;
  prompt: string;
};

type FashionStoreSchema = {
  users: FashionUser[];
  logs: FashionGenerationLog[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "fashion-users.json");

const defaultStore = (): FashionStoreSchema => ({
  users: [],
  logs: [],
});

function isProductionLike() {
  return process.env.NODE_ENV === "production" || !!process.env.VERCEL;
}

async function ensureStoreFile() {
  if (isProductionLike()) {
    return;
  }

  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(
      STORE_PATH,
      JSON.stringify(defaultStore(), null, 2),
      "utf8",
    );
  }
}

async function readStore(): Promise<FashionStoreSchema> {
  if (!isProductionLike()) {
    await ensureStoreFile();
  }

  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<FashionStoreSchema>;

    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    };
  } catch {
    return defaultStore();
  }
}

async function writeStore(store: FashionStoreSchema) {
  if (isProductionLike()) {
    return;
  }

  await ensureStoreFile();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export async function getFashionStore() {
  return readStore();
}

export async function listFashionUsers() {
  const store = await readStore();

  return [...store.users].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export async function getAllFashionUsers() {
  return listFashionUsers();
}

export async function getFashionUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const store = await readStore();

  return (
    store.users.find((user) => normalizeEmail(user.email) === normalized) ??
    null
  );
}

export async function getFashionUserById(id: string) {
  const store = await readStore();
  return store.users.find((user) => user.id === id) ?? null;
}

export async function upsertFashionUser(
  input: Partial<FashionUser> & {
    email: string;
    name?: string;
  },
) {
  const store = await readStore();
  const normalizedEmail = normalizeEmail(input.email);
  const existingIndex = store.users.findIndex(
    (user) => normalizeEmail(user.email) === normalizedEmail,
  );
  const existing = existingIndex >= 0 ? store.users[existingIndex] : null;

  const nextUser: FashionUser = {
    id: existing?.id ?? createId("fashion_user"),
    email: normalizedEmail,
    name: input.name ?? existing?.name ?? normalizedEmail.split("@")[0],
    password: input.password ?? existing?.password,
    company: input.company ?? existing?.company,
    role: input.role ?? existing?.role ?? "client",
    modules: input.modules ?? existing?.modules ?? ["fashion"],
    credits:
      typeof input.credits === "number"
        ? Math.max(0, Math.floor(input.credits))
        : existing?.credits ?? 0,
    isActive: input.isActive ?? existing?.isActive ?? true,
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
    lastGeneratedAt: input.lastGeneratedAt ?? existing?.lastGeneratedAt,
  };

  if (existingIndex >= 0) {
    store.users[existingIndex] = nextUser;
  } else {
    store.users.push(nextUser);
  }

  await writeStore(store);
  return nextUser;
}

export async function setFashionUserCredits(email: string, credits: number) {
  const user = await getFashionUserByEmail(email);

  if (!user) {
    return null;
  }

  return upsertFashionUser({
    ...user,
    email: user.email,
    credits: Math.max(0, Math.floor(credits)),
  });
}

export async function addFashionUserCredits(email: string, amount: number) {
  const user = await getFashionUserByEmail(email);

  if (!user) {
    return null;
  }

  return setFashionUserCredits(user.email, user.credits + amount);
}

export async function consumeFashionCredits(email: string, amount: number) {
  const user = await getFashionUserByEmail(email);

  if (!user) {
    return {
      ok: false as const,
      reason: "USER_NOT_FOUND" as const,
      user: null,
    };
  }

  if (!user.isActive) {
    return {
      ok: false as const,
      reason: "USER_INACTIVE" as const,
      user,
    };
  }

  if (user.credits < amount) {
    return {
      ok: false as const,
      reason: "INSUFFICIENT_CREDITS" as const,
      user,
    };
  }

  const updated = await upsertFashionUser({
    ...user,
    email: user.email,
    credits: user.credits - amount,
    lastGeneratedAt: nowIso(),
  });

  return {
    ok: true as const,
    user: updated,
  };
}

export async function addFashionGenerationLog(
  input: Omit<FashionGenerationLog, "id" | "createdAt">,
) {
  const store = await readStore();

  const log: FashionGenerationLog = {
    id: createId("fashion_log"),
    createdAt: nowIso(),
    ...input,
  };

  store.logs.unshift(log);

  if (store.logs.length > 1000) {
    store.logs.length = 1000;
  }

  await writeStore(store);
  return log;
}

export async function listFashionGenerationLogs(limit = 100) {
  const store = await readStore();
  return store.logs.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Compatibility layer for old fashion API routes */
/* ------------------------------------------------------------------ */

export async function findUserByCredentials(email: string, password?: string) {
  const user = await getFashionUserByEmail(email);

  if (!user || !user.isActive) {
    return null;
  }

  if (typeof password === "string" && (user.password ?? "") !== password) {
    return null;
  }

  return user;
}

export function getPublicUser(user: FashionUser | null) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    company: user.company,
    role: user.role,
    modules: user.modules,
    credits: user.credits,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastGeneratedAt: user.lastGeneratedAt,
  };
}

export async function createFashionUser(
  input: Partial<FashionUser> & {
    email: string;
    name?: string;
  },
) {
  const existing = await getFashionUserByEmail(input.email);

  if (existing) {
    return null;
  }

  return upsertFashionUser(input);
}

export async function findUserByIdIncludingInactive(idOrEmail: string) {
  const byId = await getFashionUserById(idOrEmail);
  if (byId) return byId;

  return getFashionUserByEmail(idOrEmail);
}

export async function getAllPublicUsers() {
  const users = await listFashionUsers();
  return users.map((user) => getPublicUser(user));
}

export async function updateFashionUser(
  input: Partial<FashionUser> & {
    email: string;
    name?: string;
  },
) {
  return upsertFashionUser(input);
}

export async function findUserById(idOrEmail: string) {
  const byId = await getFashionUserById(idOrEmail);
  if (byId && byId.isActive) return byId;

  const byEmail = await getFashionUserByEmail(idOrEmail);
  if (byEmail && byEmail.isActive) return byEmail;

  return null;
}

export async function decrementCredit(idOrEmail: string, amount = 1) {
  const user =
    (await getFashionUserById(idOrEmail)) ??
    (await getFashionUserByEmail(idOrEmail));

  if (!user) {
    return {
      ok: false as const,
      reason: "USER_NOT_FOUND" as const,
      user: null,
    };
  }

  return consumeFashionCredits(user.email, amount);
}