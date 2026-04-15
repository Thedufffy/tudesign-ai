import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prompt =
      typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json(
        { error: "Revize isteği boş olamaz." },
        { status: 400 }
      );
    }

    const interpretedPrompt = prompt;

    return NextResponse.json({
      success: true,
      interpretedPrompt,
      message: "İstek yorumlandı.",
    });
  } catch (error) {
    console.error("interpret route error:", error);

    return NextResponse.json(
      { error: "İstek yorumlanamadı." },
      { status: 500 }
    );
  }
}