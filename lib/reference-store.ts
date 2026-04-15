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