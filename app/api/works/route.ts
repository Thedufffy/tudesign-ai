import { randomUUID } from "crypto";
import { getWorks, saveWorks } from "@/lib/work-store";
import type { WorkItem } from "@/lib/work-types";

export async function GET() {
  try {
    const items = await getWorks();

    return Response.json({
      success: true,
      items,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error?.message || "Listeleme hatası.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const title = String(body.title || "").trim();
    const subtitle = String(body.subtitle || "").trim();
    const image = String(body.image || "").trim();

    if (!title) {
      return Response.json(
        { success: false, error: "Başlık gerekli." },
        { status: 400 }
      );
    }

    if (!image) {
      return Response.json(
        { success: false, error: "Görsel yolu gerekli." },
        { status: 400 }
      );
    }

    const items = await getWorks();

    const newItem: WorkItem = {
      id: randomUUID(),
      title,
      subtitle,
      image,
      createdAt: new Date().toISOString(),
    };

    items.unshift(newItem);
    await saveWorks(items);

    return Response.json({
      success: true,
      item: newItem,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error?.message || "Kayıt hatası.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { success: false, error: "ID eksik." },
        { status: 400 }
      );
    }

    const items = await getWorks();
    const filtered = items.filter((item) => item.id !== id);

    await saveWorks(filtered);

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error?.message || "Silme hatası.",
      },
      { status: 500 }
    );
  }
}