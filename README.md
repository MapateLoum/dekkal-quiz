# ⚡ Dekkal Quiz

Quiz interactif généré par IA — Next.js 15 + Groq LLaMA 3 + MongoDB Atlas

## Stack

| Élément | Choix |
|---|---|
| Framework | Next.js 15 (App Router) |
| Base de données | MongoDB Atlas |
| ORM | Prisma 6 |
| Génération questions | Groq API (LLaMA 3) |
| Styles | Tailwind CSS |
| Langage | TypeScript |

## Installation

### 1. Cloner et installer

```bash
npm install
```

### 2. Configurer le .env

Renomme `.env.example` en `.env` et remplis :

```env
DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@cluster0.XXXXX.mongodb.net/dekkal-quiz?retryWrites=true&w=majority"
GROQ_API_KEY="gsk_XXXXXXXXXXXXXXXXXXXX"
```

### 3. Initialiser Prisma

```bash
npx prisma generate
npx prisma db push
```

### 4. Lancer en développement

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

## Déploiement (Vercel)

```bash
npm install -g vercel
vercel
```

Ajoute les variables d'environnement dans le dashboard Vercel :
- `DATABASE_URL`
- `GROQ_API_KEY`

## Structure

```
src/
├── lib/
│   ├── prisma.ts       → Client Prisma singleton
│   ├── groq.ts         → Génération questions via LLaMA 3
│   └── themes.ts       → 8 thèmes configurés
└── app/
    ├── page.tsx            → Accueil (choix thème + pseudo)
    ├── quiz/page.tsx       → Jeu (10 questions, timer 30s)
    ├── leaderboard/page.tsx → Classement filtrable
    └── api/
        ├── questions/route.ts  → GET → génère questions
        └── scores/route.ts     → GET + POST → gestion scores
```

## Thèmes disponibles

- 🌍 Géographie
- ⚽ Sport
- 🎬 Cinéma & Séries
- 🔬 Science
- 🎵 Musique
- 🧠 Culture Générale
- 🏛️ Histoire
- 💻 Technologie
