import { NextResponse } from "next/server";
import { addReference, getReferences } from "@/lib/references";

export async function GET() {
  try {
    const items = await getReferences();
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/references error:", error);
    return NextResponse.json(
      { error: "Referanslar alınamadı." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const subtitle = String(body.subtitle ?? "").trim();
    const image = String(body.image ?? "").trim();
    const featured = Boolean(body.featured);

    if (!title || !subtitle || !image) {
      return NextResponse.json(
        { error: "Title, subtitle ve image zorunlu." },
        { status: 400 }
      );
    }

    const created = await addReference({
      title,
      subtitle,
      image,
      featured,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/references error:", error);
    return NextResponse.json(
      { error: "Referans eklenemedi." },
      { status: 500 }
    );
  }
}