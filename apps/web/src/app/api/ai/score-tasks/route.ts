// apps/web/src/app/api/ai/score-tasks/route.ts
import { NextResponse } from 'next/server'
import { callGeminiJSON } from '@/lib/ai/geminiClient'
import { fallbackScoreBatch, type ScoredTask } from '@/lib/ai/aesScorer'

function buildPrompt(tasks: string[]): string {
  return `You score tasks for someone with ADHD by Activation Energy Score (AES),
1 (trivial, takes seconds, no dread) to 5 (high friction, requires deep focus
to even start). Also guess a one-word or short category "anchor" for each
task if one is obvious (e.g. "Work", "Life"), or null if not obvious.

Return ONLY a JSON array, no markdown, no prose, in this exact shape:
[{ "task": "<original text>", "aes": <1-5 integer>, "anchor": "<string or null>" }]

Tasks:
${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
}

export async function POST(req: Request) {
  const { tasks } = (await req.json()) as { tasks: string[] }

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return NextResponse.json({ scored: [] })
  }

  try {
    const raw = await callGeminiJSON(buildPrompt(tasks))
    const parsed = JSON.parse(raw) as ScoredTask[]

    if (!Array.isArray(parsed) || parsed.length !== tasks.length) {
      throw new Error('Gemini returned malformed/mismatched array')
    }
    for (const item of parsed) {
      if (
        typeof item.task !== 'string' ||
        typeof item.aes !== 'number' ||
        item.aes < 1 ||
        item.aes > 5
      ) {
        throw new Error('Gemini returned an invalid item')
      }
    }

    return NextResponse.json({ scored: parsed })
  } catch (err) {
    console.error('Gemini scoring failed, using fallback:', err)
    return NextResponse.json({ scored: fallbackScoreBatch(tasks) })
  }
}