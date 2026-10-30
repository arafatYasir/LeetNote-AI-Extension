interface ProblemData {
    title: string;
    statement: string;
    url: string;
}

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
    const titleEl = await waitForElement(TITLE_SELECTOR);
    const statementEl = await waitForElement(STATEMENT_SELECTOR);

    // Clean problem title
    const title = (titleEl?.textContent ?? "").replace(/^\d+\.\s*/, "").trim();

    // Clean problem statement
    const statement = (statementEl as HTMLElement).innerText
        .replace(/\u00a0/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    if (!title || !statement) return null;

    return { title, statement, url: location.href };
}

extractProblem().then((data) => console.log("Extracted Problem: ", data));