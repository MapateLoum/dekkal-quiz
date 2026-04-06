import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface Question {
  question: string;
  options: string[];
  answer: string;
}

export async function generateQuestions(theme: string): Promise<Question[]> {
  const prompt = `Tu es un générateur de quiz en français. Génère exactement 10 questions de quiz sur le thème: "${theme}".

RÈGLES STRICTES:
- Toutes les questions et réponses doivent être en FRANÇAIS
- Chaque question doit avoir exactement 4 options de réponse (A, B, C, D)
- Une seule bonne réponse par question
- Les questions doivent être variées et intéressantes
- Niveau de difficulté moyen

RÉPONDS UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, exactement dans ce format:
[
  {
    "question": "Texte de la question ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A"
  }
]

La valeur "answer" doit être identique à l'une des valeurs dans "options".
Génère 10 questions maintenant pour le thème: ${theme}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 3000,
  });

  const content = completion.choices[0]?.message?.content || "";

  // Extract JSON from the response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Impossible de parser les questions générées");
  }

  const questions: Question[] = JSON.parse(jsonMatch[0]);

  // Validate
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Format de questions invalide");
  }

  return questions.slice(0, 10);
}
