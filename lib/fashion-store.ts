import { promises as fs } from "fs";
import path from "path";

export type FashionUserRecord = {
  email: string;
  password?: string;
  credits: number;

  // legacy / admin uyumluluğu
  name?: string;
  company?: string;
  isActive?: boolean;

  // yeni alanlar
  active?: boolean;
  role?: "admin" | "client";
  companyName?: string;

  generatedCount?: number;
  generationLogs?: Array<{
    createdAt: string;
    categoryCount: number;
    country?: string;
    prompt?: string;
  }>;
};

type FashionStoreShape = {
  users: FashionUserRecord[];
};

const STORE_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(STORE_DIR, "fashion-users.json");

function isProductionLike() {
  return process.env.NODE_ENV === "production" || !!process.env.VERCEL;
}

function getDefaultStore(): FashionStoreShape {
  return { users: [] };
}

async function safeReadJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function readStore(): Promise<FashionStoreShape> {
  const existing = await safeReadJsonFile<FashionStoreShape>(STORE_FILE);
  return existing ?? getDefaultStore();
}

async function writeStore(store: FashionStoreShape) {
  if (isProductionLike()) return;
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getAllFashionUsers() {
  const store = await readStore();
  return store.users;
}

export async function getFashionUserByEmail(email: string) {
  const store = await readStore();
  const normalized = normalizeEmail(email);

  return store.users.find((u) => normalizeEmail(u.email) === normalized) || null;
}

export async function validateFashionUser(email: string, password: string) {
  const user = await getFashionUserByEmail(email);
  if (!user) return null;
  if ((user.password ?? "") !== password) return null;

  const isActive = user.active ?? user.isActive ?? true;
  if (isActive === false) return null;

  return user;
}

export async function upsertFashionUser(user: FashionUserRecord) {
  const store = await readStore();
  const normalized = normalizeEmail(user.email);

  const normalizedUser: FashionUserRecord = {
    ...user,
    email: normalized,
    companyName: user.companyName ?? user.company,
    company: user.company ?? user.companyName,
    active: user.active ?? user.isActive ?? true,
    isActive: user.isActive ?? user.active ?? true,
    generatedCount: user.generatedCount ?? 0,
    generationLogs: user.generationLogs ?? [],
  };

  const index = store.users.findIndex(
    (u) => normalizeEmail(u.email) === normalized
  );

  if (index >= 0) {
    store.users[index] = { ...store.users[index], ...normalizedUser };
  } else {
    store.users.push(normalizedUser);
  }

  await writeStore(store);
  return normalizedUser;
}

export async function setFashionUserCredits(email: string, credits: number) {
  const store = await readStore();
  const normalized = normalizeEmail(email);

  const index = store.users.findIndex(
    (u) => normalizeEmail(u.email) === normalized
  );

  if (index < 0) return null;

  store.users[index].credits = Math.max(0, Number(credits) || 0);

  await writeStore(store);
  return store.users[index];
}

export async function consumeFashionCredits(email: string, amount = 1) {
  const store = await readStore();
  const normalized = normalizeEmail(email);

  const user = store.users.find(
    (u) => normalizeEmail(u.email) === normalized
  );

  if (!user) {
    return { ok: false, error: "user not found", user: null };
  }

  if ((user.credits ?? 0) < amount) {
    return { ok: false, error: "no credits", user };
  }

  user.credits -= amount;
  await writeStore(store);

  return { ok: true, error: null, user };
}

export async function addFashionGenerationLog(params: {
  email: string;
  categoryCount: number;
  country?: string;
  prompt?: string;
}) {
  const store = await readStore();
  const normalized = normalizeEmail(params.email);

  const user = store.users.find(
    (u) => normalizeEmail(u.email) === normalized
  );

  if (!user) return null;

  if (!user.generationLogs) user.generationLogs = [];

  user.generationLogs.unshift({
    createdAt: new Date().toISOString(),
    categoryCount: params.categoryCount,
    country: params.country,
    prompt: params.prompt,
  });

  user.generatedCount = (user.generatedCount || 0) + 1;

  await writeStore(store);
  return user;
}

/* ========================= */
/* LEGACY COMPAT EXPORTS */
/* ========================= */

export async function findUserByCredentials(email: string, password: string) {
  return validateFashionUser(email, password);
}

export function getPublicUser(user: FashionUserRecord | null) {
  if (!user) return null;

  const companyName = user.companyName ?? user.company;
  const active = user.active ?? user.isActive ?? true;

  return {
    email: user.email,
    name: user.name,
    credits: user.credits,
    role: user.role,
    company: companyName,
    companyName,
    isActive: active,
    active,
    generatedCount: user.generatedCount ?? 0,
  };
}

export async function createFashionUser(user: FashionUserRecord) {
  return upsertFashionUser(user);
}

export async function updateFashionUser(user: FashionUserRecord) {
  return upsertFashionUser(user);
}

export async function getAllPublicUsers() {
  const users = await getAllFashionUsers();
  return users.map((u) => getPublicUser(u));
}

export async function findUserByIdIncludingInactive(email: string) {
  return getFashionUserByEmail(email);
}