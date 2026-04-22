import fs from "node:fs/promises";
import path from "node:path";
import type { ReferenceLogoItem } from "@/lib/reference-types";

export type ReferenceItem = {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  featured?: boolean;
  createdAt: string;
};

type ReferenceStore = {
  references: ReferenceItem[];
  logos: ReferenceLogoItem[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "references.json");

function isProductionLike() {
  return process.env.NODE_ENV === "production" || !!process.env.VERCEL;
}

function getDefaultStore(): ReferenceStore {
  return {
    references: [],
    logos: [],
  };
}

async function ensureStoreFile() {
  if (isProductionLike()) return;

  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(
      STORE_PATH,
      JSON.stringify(getDefaultStore(), null, 2),
      "utf8"
    );
  }
}

async function readStore(): Promise<ReferenceStore> {
  if (!isProductionLike()) {
    await ensureStoreFile();
  }

  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);

    return {
      references: Array.isArray(parsed.references) ? parsed.references : [],
      logos: Array.isArray(parsed.logos) ? parsed.logos : [],
    };
  } catch {
    return getDefaultStore();
  }
}

async function writeStore(store: ReferenceStore) {
  if (isProductionLike()) return;

  await ensureStoreFile();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function createId() {
  return "ref_" + Math.random().toString(36).slice(2, 10);
}

/* references */

export async function getAllReferences() {
  const store = await readStore();
  return store.references;
}

export async function getReferenceById(id: string) {
  const store = await readStore();
  return store.references.find((r) => r.id === id) || null;
}

export async function createReference(input: {
  title: string;
  subtitle?: string;
  image: string;
  featured?: boolean;
}) {
  const store = await readStore();

  const newItem: ReferenceItem = {
    id: createId(),
    title: input.title,
    subtitle: input.subtitle,
    image: input.image,
    featured: input.featured ?? false,
    createdAt: new Date().toISOString(),
  };

  store.references.unshift(newItem);

  await writeStore(store);
  return newItem;
}

export async function deleteReference(id: string) {
  const store = await readStore();
  store.references = store.references.filter((r) => r.id !== id);
  await writeStore(store);
  return true;
}

/* logos */

export async function getReferenceLogos(): Promise<ReferenceLogoItem[]> {
  const store = await readStore();
  return store.logos;
}

export async function saveReferenceLogos(
  logos: ReferenceLogoItem[]
): Promise<ReferenceLogoItem[]> {
  const store = await readStore();
  store.logos = logos;
  await writeStore(store);
  return store.logos;
}