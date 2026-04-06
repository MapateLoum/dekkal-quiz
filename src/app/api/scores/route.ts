import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const theme = searchParams.get("theme");

  try {
    const scores = await prisma.score.findMany({
      where: theme ? { theme } : undefined,
      orderBy: [{ points: "desc" }, { createdAt: "asc" }],
      take: 20,
    });

    return NextResponse.json({ scores });
  } catch (error) {
    console.error("Erreur récupération scores:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des scores" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pseudo, theme, points, total } = body;

    if (!pseudo || !theme || points === undefined || !total) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    const score = await prisma.score.create({
      data: {
        pseudo: pseudo.trim().substring(0, 20),
        theme,
        points,
        total,
      },
    });

    return NextResponse.json({ score }, { status: 201 });
  } catch (error) {
    console.error("Erreur sauvegarde score:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde du score" },
      { status: 500 }
    );
  }
}
