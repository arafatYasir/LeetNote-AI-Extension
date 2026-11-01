export interface ProblemData {
    title: string;
    statement: string;
    url: string;
};

export type ProblemResult =
    | { ok: true; data: ProblemData; }
    | { ok: false; error: string; };

export const GET_PROBLEM = "GET_PROBLEM";

export type GeminiResult =
    | { ok: true; text: string; }
    | { ok: false; error: string; };

export interface GenerateOptions {
  systemInstruction?: string
  responseSchema?: object
}