import type { AIMessage } from "../types";

export function buildQuizGenerationPrompt(
  text: string,
  concepts: { name: string; definition: string }[],
  difficulty: "easy" | "medium" | "hard"
): AIMessage[] {
  return [
    {
      role: "system",
      content: `You are an expert educator creating quiz questions. Generate questions that test understanding at various Bloom's taxonomy levels.

Difficulty: ${difficulty}

For each question provide:
- question_text: The question
- question_type: One of [mcq, true_false, fill_blank, short_answer, scenario]
- options: Array of 4 options (for mcq only, each as a string)
- correct_answer: The correct answer
- explanation: Why this is correct
- difficulty_level: 1-5
- blooms_level: One of [remember, understand, apply, analyze, evaluate, create]
- points: 10-50 based on difficulty
- time_limit_seconds: 30-120
- related_concept: Name of the concept this tests

Generate 3-5 diverse questions mixing different question types and Bloom's levels.

Respond ONLY in valid JSON format:
{
  "questions": [...]
}`,
    },
    {
      role: "user",
      content: `Generate ${difficulty} quiz questions based on:\n\nText: ${text.slice(0, 3000)}\n\nKey concepts: ${concepts.map((c) => `${c.name}: ${c.definition}`).join("\n")}`,
    },
  ];
}

export function buildFlashcardGenerationPrompt(
  concepts: { name: string; definition: string; detailed_explanation?: string }[]
): AIMessage[] {
  return [
    {
      role: "system",
      content: `You are creating flashcards for spaced repetition learning.

For each concept, create a flashcard with:
- front_text: A question or prompt (not just the term name)
- back_text: The answer/explanation
- difficulty_level: 1-5

Make the front engaging — use questions like "What is...", "Define...", "How does... work?", "What's the difference between... and...?"

Respond ONLY in valid JSON format:
{
  "flashcards": [...]
}`,
    },
    {
      role: "user",
      content: `Create flashcards for these concepts:\n\n${JSON.stringify(concepts, null, 2)}`,
    },
  ];
}

export interface GeneratedQuestion {
  question_text: string;
  question_type: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
  difficulty_level: number;
  blooms_level: string;
  points: number;
  time_limit_seconds: number;
  related_concept?: string;
}

export interface GeneratedFlashcard {
  front_text: string;
  back_text: string;
  difficulty_level: number;
}
