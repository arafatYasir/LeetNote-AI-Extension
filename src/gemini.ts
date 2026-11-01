import { getApiKey } from "./storage";
import type { GeminiResult } from "./types";

const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const TIMEOUT_MS = 30000;

const HTTP_ERRORS: Record<number, string> = {
    400: "Bad request. The prompt may be empty or invalid api key.",
    401: "Invalid API key. Check the key you saved and try again.",
    403: "Access denied. Your API key may lack permission for this model.",
    404: "Model not found. The selected Gemini model may have been deprecated or renamed.",
    429: "Rate limit exceeded. You've sent too many requests — wait a minute and try again.",
    500: "Gemini server error. Try again shortly.",
    502: "Bad gateway. Gemini's servers are temporarily unreachable — try again in a moment.",
    503: "Gemini is temporarily overloaded or under maintenance. Try again in a few minutes.",
    504: "Gateway timeout. Gemini took too long to respond — try again.",
};

function extractText(json: any): string | null {
    const parts = json?.candidates?.[0]?.content?.parts;

    if (!Array.isArray(parts)) return null;

    const text = parts
        .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
        .join("")
        .trim();

    return text || null;
}

export async function generateText(prompt: string): Promise<GeminiResult> {
    const apiKey = await getApiKey();

    if (!apiKey) return { ok: false, error: 'No API key saved. Add one under "API key".' };

    const controller = new AbortController();
    const timer = setTimeout(() => {
        controller.abort();
    }, TIMEOUT_MS);

    try {
        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
            },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            }),
            signal: controller.signal
        });

        if (!res.ok) {
            console.error("Gemini error body: ", await res.text());
            return { ok: false, error: HTTP_ERRORS[res.status] ?? `Unexpected error from Gemini (HTTP ${res.status}). Try again later.` };
        }

        const text = extractText(await res.json());
        if (!text) return { ok: false, error: "Gemini returned no text. Please try again!" };

        return { ok: true, text };
    } catch (e) {
        console.error("Gemini request failed: ", e);

        if (e instanceof DOMException && e.name === "AbortError") {
            return { ok: false, error: "The request timed out. Try again." };
        }

        return { ok: false, error: "Network error. Check your connection and try again." };
    } finally {
        clearTimeout(timer);
    }
}
