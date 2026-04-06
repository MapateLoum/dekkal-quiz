"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Question } from "@/lib/groq";
import { getTheme } from "@/lib/themes";

type GameState = "loading" | "playing" | "result";
type AnswerState = "idle" | "correct" | "wrong";

const TIMER_SECONDS = 30;

function QuizGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pseudo = searchParams.get("pseudo") || "Joueur";
  const themeId = searchParams.get("theme") || "";
  const theme = getTheme(themeId);

  const [gameState, setGameState] = useState<GameState>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [loadError, setLoadError] = useState("");
  const [wrongAnswers, setWrongAnswers] = useState<number[]>([]);
  const [scoresSaved, setScoresSaved] = useState(false);

  // Modale de confirmation de score existant
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [existingScore, setExistingScore] = useState<{ points: number; total: number } | null>(null);
  const [pendingScore, setPendingScore] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const answeredRef = useRef(false);
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (!themeId || !theme) { router.push("/"); return; }
    fetch(`/api/questions?theme=${themeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setQuestions(data.questions);
        setGameState("playing");
      })
      .catch((err) => { console.error(err); setLoadError("Erreur lors de la génération des questions. Réessaie !"); });
  }, [themeId, theme, router]);

  const saveScore = useCallback(async (finalScore: number, overwrite = false) => {
    if (scoresSaved && !overwrite) return;
    setScoresSaved(true);
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo, theme: themeId, points: finalScore, total: questions.length, overwrite }),
      });
      const data = await res.json();

      if (res.status === 409 && data.conflict) {
        // Score existant détecté → afficher la modale
        setExistingScore(data.existing);
        setPendingScore(finalScore);
        setShowConflictModal(true);
        setScoresSaved(false); // permettre de retry
      }
    } catch (e) { console.error("Erreur sauvegarde score:", e); }
  }, [pseudo, themeId, questions.length, scoresSaved]);

  const handleOverwrite = async () => {
    setShowConflictModal(false);
    if (pendingScore !== null) await saveScore(pendingScore, true);
  };

  const handleKeepOld = () => {
    setShowConflictModal(false);
    setScoresSaved(true);
  };

  const goNext = useCallback((finalScore: number) => {
    answeredRef.current = false;
    if (currentIndex + 1 >= questions.length) {
      saveScore(finalScore);
      setGameState("result");
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setAnswerState("idle");
      setTimeLeft(TIMER_SECONDS);
    }
  }, [currentIndex, questions.length, saveScore]);

  const handleAnswer = useCallback((option: string) => {
    if (answeredRef.current || answerState !== "idle") return;
    answeredRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(option);
    const isCorrect = option === currentQuestion.answer;
    let newScore = score;
    if (isCorrect) { setAnswerState("correct"); newScore = score + 1; setScore(newScore); }
    else { setAnswerState("wrong"); setWrongAnswers((w) => [...w, currentIndex]); }
    setTimeout(() => goNext(newScore), 1200);
  }, [answerState, currentQuestion, score, currentIndex, goNext]);

  useEffect(() => {
    if (gameState !== "playing" || answerState !== "idle") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (!answeredRef.current) {
            answeredRef.current = true;
            setAnswerState("wrong");
            setWrongAnswers((w) => [...w, currentIndex]);
            setTimeout(() => goNext(score), 1200);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, currentIndex, answerState, goNext, score, currentQuestion]);

  const timerPct = (timeLeft / TIMER_SECONDS) * 100;
  const timerColor = timeLeft > 15 ? "var(--violet-light)" : timeLeft > 8 ? "var(--gold)" : "#EF4444";
  const optionLabels = ["A", "B", "C", "D"];

  // ─── MODALE CONFLIT ───
  const ConflictModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="glass-card w-full max-w-sm text-center animate-pop"
        style={{ padding: "clamp(24px, 6vw, 36px)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: "clamp(36px, 10vw, 48px)" }} className="mb-3">⚠️</div>
        <h3 className="font-bold mb-2"
          style={{ fontFamily: "var(--font-display)", color: "var(--text)", fontSize: "clamp(16px, 5vw, 20px)" }}>
          Score existant détecté
        </h3>
        <p style={{ color: "var(--muted)", fontSize: "clamp(12px, 3.5vw, 14px)" }} className="mb-2">
          Tu as déjà joué <strong style={{ color: "var(--text)" }}>{theme?.name}</strong> avec ce pseudo.
        </p>
        {existingScore && (
          <div className="rounded-xl py-2 px-4 mb-4 inline-block"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid var(--border)" }}>
            <span style={{ color: "var(--violet-light)", fontFamily: "var(--font-display)", fontSize: "clamp(14px, 4vw, 18px)", fontWeight: 700 }}>
              Ancien score : {existingScore.points}/{existingScore.total}
            </span>
          </div>
        )}
        {pendingScore !== null && (
          <p style={{ color: "var(--muted)", fontSize: "clamp(12px, 3.5vw, 13px)" }} className="mb-5">
            Nouveau score : <strong style={{ color: pendingScore > (existingScore?.points ?? 0) ? "#10B981" : "#EF4444" }}>
              {pendingScore}/{questions.length}
            </strong>
          </p>
        )}
        <div className="flex flex-col gap-2">
          <button onClick={handleOverwrite} className="btn-primary w-full"
            style={{ fontSize: "clamp(13px, 4vw, 15px)", padding: "clamp(10px, 3vw, 13px)" }}>
            🔄 Écraser avec le nouveau score
          </button>
          <button onClick={handleKeepOld}
            className="w-full rounded-xl font-semibold transition-all"
            style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
              color: "var(--muted)", fontSize: "clamp(13px, 4vw, 15px)", padding: "clamp(10px, 3vw, 13px)",
            }}>
            Garder l'ancien score
          </button>
        </div>
      </div>
    </div>
  );

  // ─── LOADING ───
  if (gameState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
        <div className="text-center animate-fade-in w-full max-w-sm">
          <div className="rounded-2xl mx-auto mb-6 flex items-center justify-center animate-pulse-slow glow-violet"
            style={{
              width: "clamp(60px, 18vw, 80px)", height: "clamp(60px, 18vw, 80px)",
              background: "linear-gradient(135deg, var(--violet), var(--violet-light))",
            }}>
            <span style={{ fontSize: "clamp(28px, 8vw, 36px)" }}>{theme?.emoji || "⚡"}</span>
          </div>
          {loadError ? (
            <>
              <p className="text-red-400 mb-4" style={{ fontSize: "clamp(13px, 4vw, 15px)" }}>{loadError}</p>
              <button onClick={() => router.push("/")} className="btn-primary">← Retour</button>
            </>
          ) : (
            <>
              <h2 className="font-bold mb-2" style={{
                fontFamily: "var(--font-display)", color: "var(--text)", fontSize: "clamp(18px, 5vw, 24px)",
              }}>
                Génération des questions...
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "clamp(12px, 3.5vw, 14px)" }}>
                Groq LLaMA 3 prépare ton quiz {theme?.name} ✨
              </p>
              <div className="flex justify-center gap-1.5 mt-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full"
                    style={{ background: "var(--violet-light)", animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── RESULT ───
  if (gameState === "result") {
    const pct = Math.round((score / questions.length) * 100);
    const medal = score === questions.length ? "🏆" : score >= 7 ? "🥇" : score >= 5 ? "🥈" : score >= 3 ? "🥉" : "💪";
    const msg = score === questions.length ? "Parfait ! Tu es imbattable !"
      : score >= 7 ? "Excellent ! Tu maîtrises le sujet !"
      : score >= 5 ? "Bien joué ! Continue comme ça !"
      : score >= 3 ? "Pas mal ! Tu peux faire mieux !"
      : "Continue de t'entraîner !";

    return (
      <div className="min-h-screen flex items-center justify-center p-4 py-8" style={{ background: "var(--bg)" }}>
        {showConflictModal && <ConflictModal />}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute rounded-full" style={{
            width: "clamp(200px, 60vw, 500px)", height: "clamp(200px, 60vw, 500px)",
            background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)",
            top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          }} />
        </div>
        <div className="relative z-10 w-full max-w-md text-center animate-pop">
          <div className="glass-card glow-violet" style={{ padding: "clamp(24px, 6vw, 40px)" }}>
            <div className="mb-4 animate-pop" style={{ fontSize: "clamp(48px, 15vw, 72px)" }}>{medal}</div>
            <h2 className="font-bold mb-1 text-gradient"
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 6vw, 30px)" }}>
              {pseudo}
            </h2>
            <p className="mb-5 sm:mb-6" style={{ color: "var(--muted)", fontSize: "clamp(12px, 3.5vw, 14px)" }}>{msg}</p>

            <div className="relative mx-auto mb-5 sm:mb-6"
              style={{ width: "clamp(110px, 35vw, 144px)", height: "clamp(110px, 35vw, 144px)" }}>
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(124,58,237,0.15)" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none"
                  stroke={score >= 7 ? "var(--gold)" : "var(--violet-light)"}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - pct / 100)}`}
                  style={{ transition: "stroke-dashoffset 1s ease" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-bold text-gradient"
                  style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 7vw, 36px)" }}>
                  {score}/{questions.length}
                </span>
                <span style={{ color: "var(--muted)", fontSize: "clamp(11px, 3vw, 13px)" }}>{pct}%</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full mb-5 sm:mb-6"
              style={{ background: "rgba(124,58,237,0.15)", border: "1px solid var(--border)" }}>
              <span style={{ fontSize: "clamp(14px, 4vw, 16px)" }}>{theme?.emoji}</span>
              <span className="font-medium" style={{ color: "var(--text)", fontSize: "clamp(12px, 3.5vw, 14px)" }}>
                {theme?.name}
              </span>
              {wrongAnswers.length > 0 && (
                <span className="px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(239,68,68,0.2)", color: "#FCA5A5", fontSize: "clamp(10px, 3vw, 12px)" }}>
                  {wrongAnswers.length} erreur{wrongAnswers.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:gap-3">
              <button
                onClick={() => { const p = new URLSearchParams({ pseudo, theme: themeId }); window.location.href = `/quiz?${p.toString()}`; }}
                className="btn-primary w-full"
                style={{ fontFamily: "var(--font-display)", fontSize: "clamp(13px, 4vw, 16px)", padding: "clamp(11px, 3vw, 14px)" }}>
                🔄 Rejouer
              </button>
              <button
                onClick={() => router.push("/leaderboard")}
                className="w-full rounded-xl font-semibold transition-all"
                style={{
                  background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
                  color: "var(--gold)", fontFamily: "var(--font-display)",
                  fontSize: "clamp(13px, 4vw, 15px)", padding: "clamp(11px, 3vw, 14px)",
                }}>
                🏆 Voir le classement
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full transition-opacity hover:opacity-75"
                style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer", fontSize: "clamp(12px, 3.5vw, 14px)" }}>
                ← Changer de thème
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PLAYING ───
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 py-6"
      style={{ background: "var(--bg)" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full animate-float"
          style={{
            width: "clamp(200px, 50vw, 400px)", height: "clamp(200px, 50vw, 400px)",
            background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)",
            top: "-80px", right: "-80px", animationDuration: "10s",
          }} />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4 sm:mb-6 animate-slide-down gap-2">
          <button onClick={() => router.push("/")}
            className="flex items-center gap-1 transition-opacity hover:opacity-75 flex-shrink-0"
            style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer", fontSize: "clamp(11px, 3vw, 14px)" }}>
            ← Quitter
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full min-w-0"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: "clamp(13px, 4vw, 16px)" }}>{theme?.emoji}</span>
            <span className="font-medium truncate"
              style={{ fontFamily: "var(--font-display)", color: "var(--text)", fontSize: "clamp(11px, 3vw, 14px)" }}>
              {theme?.name}
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex-shrink-0"
            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <span style={{ fontSize: "clamp(11px, 3vw, 14px)" }}>⭐</span>
            <span className="font-bold" style={{ color: "var(--gold)", fontFamily: "var(--font-display)", fontSize: "clamp(12px, 3.5vw, 15px)" }}>
              {score}
            </span>
          </div>
        </div>

        <div className="mb-3 sm:mb-5 animate-fade-in">
          <div className="flex justify-between mb-1.5"
            style={{ color: "var(--muted)", fontSize: "clamp(10px, 2.8vw, 12px)" }}>
            <span>Question {currentIndex + 1}/{questions.length}</span>
            <span>{questions.length - currentIndex - 1} restantes</span>
          </div>
          <div className="w-full rounded-full" style={{ height: "5px", background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
                background: "linear-gradient(90deg, var(--violet), var(--violet-light))",
              }} />
          </div>
        </div>

        <div className="mb-3 sm:mb-5 animate-fade-in">
          <div className="flex justify-between mb-1"
            style={{ color: "var(--muted)", fontSize: "clamp(10px, 2.8vw, 12px)" }}>
            <span>⏱ Temps restant</span>
            <span style={{ color: timerColor, fontWeight: 700 }}>{timeLeft}s</span>
          </div>
          <div className="w-full rounded-full" style={{ height: "6px", background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-1000 linear"
              style={{ width: `${timerPct}%`, background: timerColor }} />
          </div>
        </div>

        <div key={currentIndex} className="glass-card glow-violet mb-3 sm:mb-5 animate-slide-up"
          style={{ padding: "clamp(16px, 5vw, 28px)" }}>
          <p className="font-semibold leading-relaxed"
            style={{ color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "clamp(14px, 4vw, 18px)" }}>
            {currentQuestion?.question}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:gap-3">
          {currentQuestion?.options.map((option, i) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentQuestion.answer;
            const showCorrect = answerState !== "idle" && isCorrect;
            const showWrong = answerState !== "idle" && isSelected && !isCorrect;

            let bg = "rgba(255,255,255,0.03)";
            let border = "1px solid var(--border)";
            let color = "var(--text)";
            let labelBg = "rgba(255,255,255,0.06)";

            if (showCorrect) { bg = "rgba(16,185,129,0.15)"; border = "1.5px solid #10B981"; labelBg = "#10B981"; }
            else if (showWrong) { bg = "rgba(239,68,68,0.12)"; border = "1.5px solid #EF4444"; color = "#FCA5A5"; labelBg = "#EF4444"; }
            else if (isSelected) { bg = "rgba(124,58,237,0.15)"; border = "1.5px solid var(--violet-light)"; labelBg = "var(--violet)"; }

            return (
              <button key={i} onClick={() => handleAnswer(option)}
                disabled={answerState !== "idle"}
                className="w-full text-left rounded-2xl flex items-center gap-3 transition-all"
                style={{
                  background: bg, border,
                  padding: "clamp(10px, 3vw, 16px)",
                  cursor: answerState !== "idle" ? "default" : "pointer",
                  transform: isSelected ? "scale(1.01)" : "scale(1)",
                  opacity: answerState !== "idle" && !isSelected && !isCorrect ? 0.4 : 1,
                }}
                onMouseEnter={(e) => {
                  if (answerState === "idle") {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--violet-light)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.01)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (answerState === "idle" && !isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                  }
                }}
              >
                <span className="flex-shrink-0 flex items-center justify-center rounded-lg font-bold transition-colors"
                  style={{
                    width: "clamp(28px, 8vw, 34px)", height: "clamp(28px, 8vw, 34px)",
                    background: labelBg,
                    color: showCorrect || showWrong ? "white" : color,
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(11px, 3vw, 13px)",
                  }}>
                  {optionLabels[i]}
                </span>
                <span className="font-medium flex-1 text-left"
                  style={{ color, fontFamily: "var(--font-body)", fontSize: "clamp(12px, 3.5vw, 15px)" }}>
                  {option}
                </span>
                {showCorrect && <span className="ml-auto flex-shrink-0 text-green-400" style={{ fontSize: "clamp(14px, 4vw, 18px)" }}>✓</span>}
                {showWrong && <span className="ml-auto flex-shrink-0 text-red-400" style={{ fontSize: "clamp(14px, 4vw, 18px)" }}>✗</span>}
              </button>
            );
          })}
        </div>

        <p className="text-center mt-4 sm:mt-5" style={{ color: "var(--muted)", fontSize: "clamp(10px, 2.8vw, 12px)" }}>
          Joueur : <span style={{ color: "var(--violet-light)" }}>{pseudo}</span>
        </p>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div style={{ fontSize: "36px" }} className="animate-spin-slow">⚡</div>
      </div>
    }>
      <QuizGame />
    </Suspense>
  );
}