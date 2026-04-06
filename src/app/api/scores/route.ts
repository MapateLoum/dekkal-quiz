import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const theme = searchParams.get("theme");
  const pseudo = searchParams.get("pseudo");

  // Vérifier si un pseudo existe déjà (peu importe le thème)
  if (pseudo && !theme) {
    try {
      const existing = await prisma.score.findFirst({
        where: { pseudo: pseudo.trim() },
        select: { pseudo: true }, // ne jamais retourner le password
      });
      return NextResponse.json({ exists: !!existing });
    } catch {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  }

  // Vérifier si un score existe pour pseudo + thème
  if (pseudo && theme) {
    try {
      const existing = await prisma.score.findFirst({
        where: { pseudo: pseudo.trim(), theme },
        select: { points: true, total: true },
      });
      return NextResponse.json({ existing: existing || null });
    } catch {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  }

  // Leaderboard normal
  try {
    const scores = await prisma.score.findMany({
      where: theme ? { theme } : undefined,
      orderBy: [{ points: "desc" }, { createdAt: "asc" }],
      take: 20,
      select: { id: true, pseudo: true, theme: true, points: true, total: true, createdAt: true },
    });
    return NextResponse.json({ scores });
  } catch (error) {
    console.error("Erreur récupération scores:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des scores" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pseudo, theme, points, total, password, overwrite } = body;

    if (!pseudo || !theme || points === undefined || !total || !password) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const cleanPseudo = pseudo.trim().substring(0, 20);

    // Chercher un score existant pour ce pseudo (n'importe quel thème)
    const existingAny = await prisma.score.findFirst({
      where: { pseudo: cleanPseudo },
    });

    // Si le pseudo existe, vérifier le mot de passe
    if (existingAny) {
      const passwordOk = await bcrypt.compare(password, existingAny.password);
      if (!passwordOk) {
        return NextResponse.json({ error: "Mot de passe incorrect pour ce pseudo" }, { status: 401 });
      }
    }

    // Chercher un score existant pour ce pseudo + thème
    const existingScore = await prisma.score.findFirst({
      where: { pseudo: cleanPseudo, theme },
    });

    // Hasher le mot de passe (seulement pour un nouveau pseudo)
    const hashedPassword = existingAny
      ? existingAny.password // garder le même hash
      : await bcrypt.hash(password, 10);

    if (existingScore && !overwrite) {
      return NextResponse.json({ conflict: true, existing: { points: existingScore.points, total: existingScore.total } }, { status: 409 });
    }

    if (existingScore && overwrite) {
      const updated = await prisma.score.update({
        where: { id: existingScore.id },
        data: { points, total, createdAt: new Date() },
        select: { id: true, pseudo: true, theme: true, points: true, total: true, createdAt: true },
      });
      return NextResponse.json({ score: updated }, { status: 200 });
    }

    // Nouveau score
    const score = await prisma.score.create({
      data: { pseudo: cleanPseudo, theme, points, total, password: hashedPassword },
      select: { id: true, pseudo: true, theme: true, points: true, total: true, createdAt: true },
    });
    return NextResponse.json({ score }, { status: 201 });

  } catch (error) {
    console.error("Erreur sauvegarde score:", error);
    return NextResponse.json({ error: "Erreur lors de la sauvegarde du score" }, { status: 500 });
  }
}