// «Сенсей» on Google Gemini: the free alternative to Claude.
// Used when GEMINI_API_KEY is set and ANTHROPIC_API_KEY is not (Claude wins if both are set).
// Free tier: Google may use the questions to improve its products, and the daily limit is small,
// so the assistant never receives personal data and falls back to built-in answers when the limit is reached.
import { GoogleGenAI, ApiError, type Content } from '@google/genai';

/** Stable, fast model with a free tier (Nov 2026). Override with GEMINI_MODEL. */
export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';

export const hasGeminiKey = () => !!process.env.GEMINI_API_KEY?.trim();

/**
 * The page sends history as {role: 'user' | 'model', text}. Gemini wants
 * [{role: 'user' | 'model', parts: [{text}]}], starting with a user turn; the new question goes last.
 */
export function toGeminiContents(history: unknown, message: string): Content[] {
  const contents: Content[] = [];
  if (Array.isArray(history)) {
    for (const item of history.slice(-12)) {
      const role = item?.role === 'user' ? 'user' : item?.role === 'model' || item?.role === 'assistant' ? 'model' : null;
      const text = typeof item?.text === 'string' ? item.text.trim() : '';
      if (!role || !text) continue;
      if (contents.length === 0 && role === 'model') continue;
      contents.push({ role, parts: [{ text: text.slice(0, 4000) }] });
    }
  }
  contents.push({ role: 'user', parts: [{ text: message.slice(0, 4000) }] });
  return contents;
}

export type GeminiResult = { ok: true; reply: string } | { ok: false; reason: 'limit' | 'empty' | 'error' };

export async function askGemini(system: string, history: unknown, message: string): Promise<GeminiResult> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!.trim() });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: toGeminiContents(history, message),
      config: { systemInstruction: system, maxOutputTokens: 2048 }
    });
    const reply = (response.text || '').trim();
    return reply ? { ok: true, reply } : { ok: false, reason: 'empty' };
  } catch (error: any) {
    if (error instanceof ApiError) {
      if (error.status === 429) {
        console.warn('[Sensei Gemini] free daily limit reached');
        return { ok: false, reason: 'limit' };
      }
      console.error(`[Sensei Gemini] API error ${error.status}:`, error.message);
    } else {
      console.error('[Sensei Gemini] error:', error?.message || error);
    }
    return { ok: false, reason: 'error' };
  }
}
