import type { ProblemResult } from "./types"

export async function requestProblem(tabId: number): Promise<ProblemResult> {
    try {
        const result: ProblemResult | undefined = await chrome.tabs.sendMessage(tabId, {
            type: "GET_PROBLEM"
        });

        return result ?? { ok: false, error: "No response from the page." };
    } catch (e) {
        console.error(e);
        return {
            ok: false,
            error: "Could not reach the page. Refresh the LeetCode tab and try again. Make sure you're on the description page."
        };
    }
}