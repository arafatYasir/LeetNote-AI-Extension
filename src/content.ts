import type { ProblemData, ProblemResult } from "./types"

const TITLE_SELECTOR = 'div[role="heading"] > a';
const STATEMENT_SELECTOR = 'div[data-track-load="description_content"]';

function waitForElement(selector: string, timeoutMs = 5000): Promise<Element | null> {
    return new Promise((resolve) => {
        const existing = document.querySelector(selector);

        if (existing) return resolve(existing);

        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);

            if (el) {
                observer.disconnect();
                clearTimeout(timer);
                resolve(el);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        const timer = setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeoutMs);
    });
}

async function extractProblem(): Promise<ProblemData | null> {
    const [titleEl, statementEl] = await Promise.all([
        waitForElement(TITLE_SELECTOR),
        waitForElement(STATEMENT_SELECTOR),
    ]);

    if (!statementEl || !(statementEl instanceof HTMLElement) || statementEl.getClientRects().length === 0) {
        return null;
    }

    // Clean problem title
    const title = (titleEl?.textContent ?? "").replace(/^\d+\.\s*/, "").trim();

    // Clean problem statement
    const statement = statementEl.innerText
        .replace(/\u00a0/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    if (!title || !statement) return null;

    return { title, statement, url: location.href };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "GET_PROBLEM") return false;

    extractProblem()
        .then((data) => {
            const result: ProblemResult = data
                ? { ok: true, data }
                : { ok: false, error: "Could not find the problem title or description on this page." };

            sendResponse(result);
        })
        .catch((e) => {
            console.error("Error extracting problem: ", e);
            sendResponse({ ok: false, error: "Failed to extract problem details." });
        });

    return true;
});
