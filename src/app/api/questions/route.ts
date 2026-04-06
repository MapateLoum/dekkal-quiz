import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "@/lib/groq";
import { getTheme } from "@/lib/themes";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const themeId = searchParams.get("theme");

  if (!themeId) {
    return NextResponse.json(
      { error: "Paramètre 'theme' manquant" },
      { status: 400 }
    );
  }

  const theme = getTheme(themeId);
  if (!theme) {
    return NextResponse.json(
      { error: "Thème invalide" },
      { status: 400 }
    );
  }

  try {
    const questions = await generateQuestions(theme.name);
    return NextResponse.json({ questions, theme });
  } catch (error) {
    console.error("Erreur génération questions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération des questions" },
      { status: 500 }
    );
  }
}
