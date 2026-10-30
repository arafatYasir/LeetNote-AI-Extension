export interface ProblemData {
    title: string;
    statement: string;
    url: string;
};

export type ProblemResult =
    | { ok: true; data: ProblemData; }
    | { ok: false; error: string; };

export const GET_PROBLEM = "GET_PROBLEM";