// lib/fashion-store.ts

import { promises as fs } from "fs";
import path from "path";

export type FashionUserRecord = {
  email: string;
  password: string;
  credits: number;
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

async function ensureStoreFile() {
  if (isProductionLike()) {
    return;
  }

  await fs.mkdir(STORE_DIR, { recursive: true });

  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(
      STORE_FILE,
      JSON.stringify(getDefaultStore(), null, 2),
      "utf8"
    );
  }
}

async function readStore(): Promise<FashionStoreShape> {
  // Production/Vercel: read-only davran
  if (isProductionLike()) {
    const existing = await safeReadJsonFile<FashionStoreShape>(STORE_FILE);
    return existing ?? getDefaultStore();
  }

  await ensureStoreFile();
  const existing = await safeReadJsonFile<FashionStoreShape>(STORE_FILE);
  return existing ?? getDefaultStore();
}

async function writeStore(store: FashionStoreShape) {
  // Production/Vercel: dosya sistemi read-only olduğu için yazma
  if (isProductionLike()) {
    return;
  }

  await ensureStoreFile();
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

  return (
    store.users.find((user) => normalizeEmail(user.email) === normalized) || null
  );
}

export async function validateFashionUser(email: string, password: string) {
  const user = await getFashionUserByEmail(email);
  if (!user) return null;
  if (user.password !== password) return null;
  if (user.active === false) return null;
  return user;
}

export async function upsertFashionUser(user: FashionUserRecord) {
  const store = await readStore();
  const normalized = normalizeEmail(user.email);

  const index = store.users.findIndex(
    (item) => normalizeEmail(item.email) === normalized
  );

  const nextUser: FashionUserRecord = {
    ...user,
    email: normalized,
    generatedCount: user.generatedCount ?? 0,
    generationLogs: user.generationLogs ?? [],
  };

  if (index >= 0) {
    store.users[index] = {
      ...store.users[index],
      ...nextUser,
    };
  } else {
    store.users.push(nextUser);
  }

  await writeStore(store);
  return nextUser;
}

export async function setFashionUserCredits(email: string, credits: number) {
  const store = await readStore();
  const normalized = normalizeEmail(email);

  const index = store.users.findIndex(
    (item) => normalizeEmail(item.email) === normalized
  );

  if (index < 0) return null;

  store.users[index].credits = Math.max(0, Number(credits) || 0);
  await writeStore(store);

  return store.users[index];
}

export async function consumeFashionCredits(email: string, amount = 1) {
  const store = await readStore();
  const normalized = normalizeEmail(email);

  const index = store.users.findIndex(
    (item) => normalizeEmail(item.email) === normalized
  );

  if (index < 0) {
    return {
      ok: false,
      error: "Kullanıcı bulunamadı.",
      user: null,
    };
  }

  const user = store.users[index];
  const currentCredits = Number(user.credits || 0);
  const nextCredits = currentCredits - amount;

  if (nextCredits < 0) {
    return {
      ok: false,
      error: "Yetersiz kredi.",
      user,
    };
  }

  user.credits = nextCredits;

  // Production'da writeStore no-op olduğu için sistem patlamaz
  await writeStore(store);

  return {
    ok: true,
    error: null,
    user,
  };
}

export async function addFashionGenerationLog(params: {
  email: string;
  categoryCount: number;
  country?: string;
  prompt?: string;
}) {
  const store = await readStore();
  const normalized = normalizeEmail(params.email);

  const index = store.users.findIndex(
    (item) => normalizeEmail(item.email) === normalized
  );

  if (index < 0) {
    return null;
  }

  const user = store.users[index];

  if (!Array.isArray(user.generationLogs)) {
    user.generationLogs = [];
  }

  user.generationLogs.unshift({
    createdAt: new Date().toISOString(),
    categoryCount: params.categoryCount,
    country: params.country,
    prompt: params.prompt,
  });

  user.generationLogs = user.generationLogs.slice(0, 50);
  user.generatedCount = Number(user.generatedCount || 0) + 1;

  await writeStore(store);

  return user;
}