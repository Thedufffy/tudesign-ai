import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export type FashionUser = {
  id: string;
  email: string;
  name: string;
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

async function ensureStoreFile() {
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
  await ensureStoreFile();

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
  const currentTime = nowIso();

  const existingIndex = store.users.findIndex(
    (user) => normalizeEmail(user.email) === normalizedEmail,
  );

  if (existingIndex >= 0) {
    const existing = store.users[existingIndex];

    const updated: FashionUser = {
      ...existing,
      email: normalizedEmail,
      name: input.name ?? existing.name,
      company: input.company ?? existing.company,
      role: input.role ?? existing.role,
      modules: input.modules ?? existing.modules,
      credits:
        typeof input.credits === "number" ? input.credits : existing.credits,
      isActive:
        typeof input.isActive === "boolean"
          ? input.isActive
          : existing.isActive,
      updatedAt: currentTime,
      lastGeneratedAt: input.lastGeneratedAt ?? existing.lastGeneratedAt,
    };

    store.users[existingIndex] = updated;
    await writeStore(store);
    return updated;
  }

  const created: FashionUser = {
    id: input.id ?? createId("fashion_user"),
    email: normalizedEmail,
    name: input.name ?? normalizedEmail.split("@")[0] ?? "Client",
    company: input.company ?? "",
    role: input.role ?? "client",
    modules: input.modules ?? ["fashion"],
    credits: typeof input.credits === "number" ? input.credits : 0,
    isActive: typeof input.isActive === "boolean" ? input.isActive : true,
    createdAt: currentTime,
    updatedAt: currentTime,
    lastGeneratedAt: input.lastGeneratedAt,
  };

  store.users.unshift(created);
  await writeStore(store);
  return created;
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