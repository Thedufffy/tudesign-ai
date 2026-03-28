import { NextResponse } from "next/server";
import { deleteReference } from "@/lib/references";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Geçersiz referans id." },
        { status: 400 }
      );
    }

    await deleteReference(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/references/[id] error:", error);
    return NextResponse.json(
      { error: "Referans silinemedi." },
      { status: 500 }
    );
  }
}