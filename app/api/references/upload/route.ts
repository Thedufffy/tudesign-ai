import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json(
        { success: false, error: "Logo dosyası bulunamadı." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext =
      file.name.split(".").pop()?.toLowerCase() ||
      file.type.split("/").pop() ||
      "png";

    const fileName = `${randomUUID()}.${ext}`;
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "references"
    );
    const filePath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    return Response.json({
      success: true,
      path: `/uploads/references/${fileName}`,
    });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error?.message || "Logo yükleme hatası." },
      { status: 500 }
    );
  }
}