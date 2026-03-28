import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data/uploads.json");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Dosya yok" }, { status: 400 });
    }

    const blob = await put(`uploads/${Date.now()}-${file.name}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // JSON'a kaydet
    const existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const newItem = {
      id: Date.now().toString(),
      url: blob.url,
      createdAt: new Date().toISOString(),
    };

    existing.unshift(newItem);

    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));

    return NextResponse.json(newItem);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload hatası" }, { status: 500 });
  }
}