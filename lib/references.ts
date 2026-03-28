import fs from "node:fs/promises";
import path from "node:path";

export type ReferenceItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  featured: boolean;
};

const filePath = path.join(process.cwd(), "data", "references.json");

export async function getReferences(): Promise<ReferenceItem[]> {
  const file = await fs.readFile(filePath, "utf-8");
  return JSON.parse(file) as ReferenceItem[];
}

export async function saveReferences(items: ReferenceItem[]) {
  await fs.writeFile(filePath, JSON.stringify(items, null, 2), "utf-8");
}

export async function addReference(
  input: Omit<ReferenceItem, "id">
): Promise<ReferenceItem> {
  const items = await getReferences();

  const newItem: ReferenceItem = {
    id: crypto.randomUUID(),
    ...input,
  };

  items.unshift(newItem);
  await saveReferences(items);

  return newItem;
}

export async function deleteReference(id: string) {
  const items = await getReferences();
  const filtered = items.filter((item) => item.id !== id);
  await saveReferences(filtered);
}