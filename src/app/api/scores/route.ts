import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const theme = searchParams.get("theme");
  const pseudo = searchParams.get("pseudo");

  // Vérifier si un score existe pour pseudo + thème
  if (pseudo && theme) {
    try {
      const existing = await prisma.score.findFirst({
        where: { pseudo: pseudo.trim(), theme },
      });
      return NextResponse.json({ existing: existing || null });
    } catch (error) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  }

  // Leaderboard normal
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
    const { pseudo, theme, points, total, overwrite } = body;

    if (!pseudo || !theme || points === undefined || !total) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const cleanPseudo = pseudo.trim().substring(0, 20);

    // Vérifier si un score existe déjà
    const existing = await prisma.score.findFirst({
      where: { pseudo: cleanPseudo, theme },
    });

    if (existing && !overwrite) {
      // Score existant, on demande confirmation côté client
      return NextResponse.json({ conflict: true, existing }, { status: 409 });
    }

    if (existing && overwrite) {
      // Écraser l'ancien score
      const updated = await prisma.score.update({
        where: { id: existing.id },
        data: { points, total, createdAt: new Date() },
      });
      return NextResponse.json({ score: updated }, { status: 200 });
    }

    // Nouveau score
    const score = await prisma.score.create({
      data: { pseudo: cleanPseudo, theme, points, total },
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