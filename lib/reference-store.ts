import fs from "fs/promises";
import path from "path";
import type { ReferenceLogoItem } from "./reference-types";

const dataFilePath = path.join(process.cwd(), "data", "reference-logos.json");

async function ensureFile() {
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await fs.writeFile(dataFilePath, "[]", "utf8");
  }
}

export async function getReferenceLogos(): Promise<ReferenceLogoItem[]> {
  await ensureFile();

  const raw = await fs.readFile(dataFilePath, "utf8");
  const items = JSON.parse(raw) as ReferenceLogoItem[];

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function saveReferenceLogos(items: ReferenceLogoItem[]) {
  await ensureFile();
  await fs.writeFile(dataFilePath, JSON.stringify(items, null, 2), "utf8");
}
// ===== LEGACY COMPAT (ESKİ API'LER İÇİN) =====

// login için
export async function findUserByCredentials(email: string, password: string) {
  return validateFashionUser(email, password);
}

// public user (frontend'e güvenli veri)
export function getPublicUser(user: FashionUserRecord) {
  if (!user) return null;

  return {
    email: user.email,
    credits: user.credits,
    role: user.role,
    companyName: user.companyName,
    generatedCount: user.generatedCount ?? 0,
  };
}

// admin create
export async function createFashionUser(user: FashionUserRecord) {
  return upsertFashionUser(user);
}

// admin update
export async function updateFashionUser(user: FashionUserRecord) {
  return upsertFashionUser(user);
}

// admin list
export async function getAllPublicUsers() {
  const users = await getAllFashionUsers();

  return users.map((u) => getPublicUser(u));
}

// admin find by id (email bazlı kullanıyoruz)
export async function findUserByIdIncludingInactive(email: string) {
  return getFashionUserByEmail(email);
}