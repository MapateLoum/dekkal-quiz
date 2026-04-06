"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { themes } from "@/lib/themes";

export default function HomePage() {
  const router = useRouter();
  const [pseudo, setPseudo] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleStart = () => {
    if (!pseudo.trim()) { setError("Entre ton pseudo pour commencer !"); return; }
    if (!selectedTheme) { setError("Choisis un thème !"); return; }
    setError("");
    const params = new URLSearchParams({ pseudo: pseudo.trim(), theme: selectedTheme });
    router.push(`/quiz?${params.toString()}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 py-8"
      style={{ background: "var(--bg)" }}>

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full animate-float"
          style={{
            width: "clamp(200px, 50vw, 500px)", height: "clamp(200px, 50vw, 500px)",
            background: "radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)",
            top: "-80px", left: "-80px", animationDuration: "9s",
          }} />
        <div className="absolute rounded-full animate-float-reverse"
          style={{
            width: "clamp(150px, 40vw, 400px)", height: "clamp(150px, 40vw, 400px)",
            background: "radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)",
            bottom: "-60px", right: "-60px", animationDuration: "11s",
          }} />
        <div className="absolute rounded-full animate-float"
          style={{
            width: "clamp(100px, 25vw, 300px)", height: "clamp(100px, 25vw, 300px)",
            background: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)",
            top: "40%", left: "65%", animationDuration: "7s", animationDelay: "3s",
          }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-xl animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center justify-center rounded-2xl mb-4 sm:mb-5 glow-violet"
            style={{
              width: "clamp(56px, 15vw, 80px)", height: "clamp(56px, 15vw, 80px)",
              background: "linear-gradient(135deg, var(--violet), var(--violet-light))",
            }}>
            <span style={{ fontSize: "clamp(24px, 6vw, 36px)" }}>⚡</span>
          </div>
          <h1 className="font-bold text-gradient mb-2"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 8vw, 48px)",
              letterSpacing: "-1px",
            }}>
            Dekkal Quiz
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "clamp(12px, 3.5vw, 15px)" }}>
            10 questions. 30 secondes chacune. Bonne chance ! 🎯
          </p>
        </div>

        {/* Card */}
        <div className="glass-card glow-violet"
          style={{ padding: "clamp(20px, 5vw, 32px)" }}>

          {/* Pseudo input */}
          <div className="mb-5 sm:mb-7">
            <label className="block mb-2 text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--muted)" }}>
              Ton pseudo
            </label>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => { setPseudo(e.target.value); setError(""); }}
              placeholder="Ex: Papis_Loum"
              maxLength={20}
              className="w-full rounded-xl px-4 py-3 text-base outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontFamily: "var(--font-body)",
                fontSize: "clamp(14px, 4vw, 16px)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--violet-light)";
                e.target.style.boxShadow = "0 0 0 3px rgba(168,85,247,0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.boxShadow = "none";
              }}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />
          </div>

          {/* Theme selection */}
          <div className="mb-5 sm:mb-7">
            <label className="block mb-3 text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--muted)" }}>
              Choisis ton thème
            </label>
            <div className="grid gap-2 sm:gap-3"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 180px), 1fr))" }}>
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => { setSelectedTheme(theme.id); setError(""); }}
                  className="text-left rounded-2xl transition-all cursor-pointer"
                  style={{
                    padding: "clamp(10px, 3vw, 16px)",
                    background: selectedTheme === theme.id
                      ? `linear-gradient(135deg, ${theme.color}22, ${theme.color}44)`
                      : "rgba(255,255,255,0.03)",
                    border: selectedTheme === theme.id
                      ? `1.5px solid ${theme.color}`
                      : "1.5px solid var(--border)",
                    boxShadow: selectedTheme === theme.id ? `0 0 20px ${theme.color}33` : "none",
                    transform: selectedTheme === theme.id ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span style={{ fontSize: "clamp(18px, 5vw, 24px)" }}>{theme.emoji}</span>
                    <div>
                      <div className="font-semibold" style={{
                        fontFamily: "var(--font-display)",
                        color: "var(--text)",
                        fontSize: "clamp(12px, 3.5vw, 14px)",
                      }}>
                        {theme.name}
                      </div>
                      <div className="mt-0.5 hidden sm:block" style={{
                        color: "var(--muted)",
                        fontSize: "11px",
                      }}>
                        {theme.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm animate-slide-down"
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#FCA5A5",
                fontSize: "clamp(12px, 3.5vw, 14px)",
              }}>
              ⚠️ {error}
            </div>
          )}

          {/* Start button */}
          <button
            onClick={handleStart}
            className="w-full btn-primary text-center"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(14px, 4vw, 17px)",
              padding: "clamp(12px, 3.5vw, 15px) 24px",
            }}
          >
            Lancer la partie →
          </button>

          {/* Leaderboard link */}
          <div className="text-center mt-4 sm:mt-5">
            <a href="/leaderboard"
              className="inline-flex items-center gap-2 transition-opacity hover:opacity-75"
              style={{ color: "var(--gold)", fontSize: "clamp(12px, 3.5vw, 14px)" }}>
              🏆 Voir le classement
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-4 sm:mt-6"
          style={{ color: "var(--muted)", fontSize: "clamp(10px, 3vw, 12px)" }}>
          Questions générées par IA • Groq LLaMA 3
        </p>
      </div>
    </div>
  );
}
