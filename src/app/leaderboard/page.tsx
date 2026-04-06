"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { themes } from "@/lib/themes";

interface Score {
  id: string;
  pseudo: string;
  theme: string;
  points: number;
  total: number;
  createdAt: string;
}

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<string>(searchParams.get("theme") || "");

  useEffect(() => {
    setLoading(true);
    const url = selectedTheme ? `/api/scores?theme=${selectedTheme}` : `/api/scores`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setScores(data.scores || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedTheme]);

  const getThemeInfo = (id: string) => themes.find((t) => t.id === id);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { color: "#F59E0B", icon: "🥇" };
    if (rank === 2) return { color: "#94A3B8", icon: "🥈" };
    if (rank === 3) return { color: "#CD7C2F", icon: "🥉" };
    return { color: "var(--muted)", icon: `#${rank}` };
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 pb-12" style={{ background: "var(--bg)" }}>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full animate-float"
          style={{
            width: "clamp(200px, 50vw, 500px)", height: "clamp(200px, 50vw, 500px)",
            background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
            top: "-100px", left: "-100px", animationDuration: "10s",
          }} />
        <div className="absolute rounded-full animate-float-reverse"
          style={{
            width: "clamp(150px, 40vw, 400px)", height: "clamp(150px, 40vw, 400px)",
            background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
            bottom: "-80px", right: "-80px",
          }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8 pt-3 sm:pt-4 animate-slide-down">
          <button onClick={() => router.push("/")}
            className="flex items-center gap-1 transition-opacity hover:opacity-75 flex-shrink-0"
            style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer", fontSize: "clamp(11px, 3vw, 14px)" }}>
            ← Accueil
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-bold text-gradient"
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 7vw, 40px)", letterSpacing: "-1px" }}>
              🏆 Classement
            </h1>
            <p className="mt-0.5 sm:mt-1" style={{ color: "var(--muted)", fontSize: "clamp(11px, 3vw, 14px)" }}>
              Les meilleurs joueurs de Dekkal Quiz
            </p>
          </div>
          <div style={{ width: "clamp(50px, 12vw, 80px)" }} />
        </div>

        {/* Theme filter — horizontal scroll on mobile */}
        <div className="mb-5 sm:mb-6 animate-slide-up">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <style>{`.theme-scroll::-webkit-scrollbar { display: none; }`}</style>
            <button
              onClick={() => setSelectedTheme("")}
              className="flex-shrink-0 rounded-full font-medium transition-all"
              style={{
                padding: "clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px)",
                fontSize: "clamp(11px, 3vw, 13px)",
                background: selectedTheme === "" ? "linear-gradient(135deg, var(--violet), var(--violet-light))" : "rgba(255,255,255,0.04)",
                border: selectedTheme === "" ? "1.5px solid var(--violet-light)" : "1.5px solid var(--border)",
                color: selectedTheme === "" ? "white" : "var(--muted)",
                fontFamily: "var(--font-display)",
                boxShadow: selectedTheme === "" ? "0 4px 15px rgba(124,58,237,0.3)" : "none",
                whiteSpace: "nowrap",
              }}>
              🌐 Tous
            </button>
            {themes.map((t) => (
              <button key={t.id} onClick={() => setSelectedTheme(t.id)}
                className="flex-shrink-0 rounded-full font-medium transition-all"
                style={{
                  padding: "clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px)",
                  fontSize: "clamp(11px, 3vw, 13px)",
                  background: selectedTheme === t.id ? `linear-gradient(135deg, ${t.color}44, ${t.color}66)` : "rgba(255,255,255,0.04)",
                  border: selectedTheme === t.id ? `1.5px solid ${t.color}` : "1.5px solid var(--border)",
                  color: selectedTheme === t.id ? "white" : "var(--muted)",
                  fontFamily: "var(--font-display)",
                  boxShadow: selectedTheme === t.id ? `0 4px 15px ${t.color}44` : "none",
                  whiteSpace: "nowrap",
                }}>
                {t.emoji} {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Scores */}
        <div className="animate-fade-in">
          {loading ? (
            <div className="text-center py-12 sm:py-16">
              <div className="flex justify-center gap-1.5 mb-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2.5 h-2.5 rounded-full"
                    style={{ background: "var(--violet-light)", animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
              <p style={{ color: "var(--muted)", fontSize: "clamp(12px, 3.5vw, 14px)" }}>Chargement...</p>
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-12 sm:py-16 glass-card" style={{ padding: "clamp(24px, 6vw, 48px)" }}>
              <div className="mb-4" style={{ fontSize: "clamp(36px, 10vw, 48px)" }}>🎯</div>
              <p className="font-semibold mb-2"
                style={{ fontFamily: "var(--font-display)", color: "var(--text)", fontSize: "clamp(16px, 4.5vw, 20px)" }}>
                Aucun score pour l&apos;instant
              </p>
              <p className="mb-6" style={{ color: "var(--muted)", fontSize: "clamp(12px, 3.5vw, 14px)" }}>
                Sois le premier à jouer !
              </p>
              <button onClick={() => router.push("/")} className="btn-primary"
                style={{ fontFamily: "var(--font-display)", fontSize: "clamp(13px, 4vw, 15px)" }}>
                Jouer maintenant →
              </button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">

              {/* Top 3 podium — responsive */}
              {scores.slice(0, 3).length === 3 && (
                <div className="flex items-end justify-center gap-2 sm:gap-3 mb-5 sm:mb-6 px-2">
                  {[
                    { score: scores[1], rank: 2, height: "clamp(80px, 20vw, 96px)", mt: "clamp(28px, 8vw, 36px)" },
                    { score: scores[0], rank: 1, height: "clamp(100px, 25vw, 128px)", mt: "0px" },
                    { score: scores[2], rank: 3, height: "clamp(70px, 17vw, 80px)", mt: "clamp(44px, 12vw, 56px)" },
                  ].map(({ score: s, rank, height, mt }) => {
                    const rankStyle = getRankStyle(rank);
                    const themeInfo = getThemeInfo(s.theme);
                    const pct = Math.round((s.points / s.total) * 100);
                    return (
                      <div key={s.id}
                        className="flex-1 glass-card flex flex-col items-center justify-end pb-3 pt-2 px-1 relative overflow-hidden"
                        style={{
                          height, marginTop: mt, maxWidth: "clamp(90px, 28vw, 160px)",
                          borderColor: rank === 1 ? "rgba(245,158,11,0.4)" : "var(--border)",
                          boxShadow: rank === 1 ? "0 0 30px rgba(245,158,11,0.15)" : "none",
                        }}>
                        <div className="absolute top-1.5 right-1.5" style={{ fontSize: "clamp(14px, 4vw, 18px)" }}>
                          {rankStyle.icon}
                        </div>
                        <div style={{ fontSize: "clamp(16px, 5vw, 22px)" }}>{themeInfo?.emoji}</div>
                        <div className="font-bold text-center truncate w-full px-1"
                          style={{ fontFamily: "var(--font-display)", color: rankStyle.color, fontSize: "clamp(10px, 2.8vw, 13px)" }}>
                          {s.pseudo}
                        </div>
                        <div className="font-bold"
                          style={{ fontFamily: "var(--font-display)", color: "var(--text)", fontSize: "clamp(13px, 4vw, 18px)" }}>
                          {s.points}/{s.total}
                        </div>
                        <div style={{ color: "var(--muted)", fontSize: "clamp(9px, 2.5vw, 11px)" }}>{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Full list */}
              {scores.map((s, i) => {
                const rank = getRankStyle(i + 1);
                const themeInfo = getThemeInfo(s.theme);
                const pct = Math.round((s.points / s.total) * 100);
                const date = new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

                return (
                  <div key={s.id}
                    className="glass-card flex items-center gap-2 sm:gap-4 transition-all"
                    style={{
                      padding: "clamp(10px, 3vw, 16px) clamp(12px, 4vw, 20px)",
                      borderColor: i < 3 ? `${rank.color}44` : "var(--border)",
                      animationDelay: `${i * 0.04}s`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "var(--violet-light)";
                      (e.currentTarget as HTMLDivElement).style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = i < 3 ? `${rank.color}44` : "var(--border)";
                      (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)";
                    }}>

                    {/* Rank */}
                    <div className="text-center font-bold flex-shrink-0"
                      style={{
                        width: "clamp(22px, 6vw, 32px)",
                        fontFamily: "var(--font-display)",
                        color: rank.color,
                        fontSize: "clamp(12px, 3.5vw, 15px)",
                      }}>
                      {rank.icon}
                    </div>

                    {/* Theme emoji */}
                    <div className="flex-shrink-0 flex items-center justify-center rounded-xl"
                      style={{
                        width: "clamp(30px, 8vw, 38px)", height: "clamp(30px, 8vw, 38px)",
                        fontSize: "clamp(14px, 4vw, 18px)",
                        background: themeInfo ? `${themeInfo.color}22` : "rgba(255,255,255,0.05)",
                        border: `1px solid ${themeInfo?.color ?? "var(--border)"}44`,
                      }}>
                      {themeInfo?.emoji || "🎯"}
                    </div>

                    {/* Name + theme */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate"
                        style={{ fontFamily: "var(--font-display)", color: "var(--text)", fontSize: "clamp(12px, 3.5vw, 14px)" }}>
                        {s.pseudo}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: "clamp(10px, 2.8vw, 12px)" }}>
                        {themeInfo?.name} · {date}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex-shrink-0 text-right">
                      <div className="font-bold"
                        style={{
                          fontFamily: "var(--font-display)",
                          color: pct === 100 ? "var(--gold)" : pct >= 70 ? "var(--violet-light)" : "var(--text)",
                          fontSize: "clamp(13px, 4vw, 16px)",
                        }}>
                        {s.points}/{s.total}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: "clamp(10px, 2.8vw, 12px)" }}>{pct}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-8 sm:mt-10">
          <button onClick={() => router.push("/")} className="btn-primary"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(13px, 4vw, 16px)" }}>
            ⚡ Jouer maintenant
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div style={{ fontSize: "36px" }} className="animate-spin-slow">🏆</div>
      </div>
    }>
      <LeaderboardContent />
    </Suspense>
  );
}
