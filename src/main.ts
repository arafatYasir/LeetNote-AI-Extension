import { readEditorCode } from "./editorCode";
import { requestProblem } from "./problem";
import type { EditorCode } from "./editorCode";
import type { ProblemData } from "./types";
import "./style.css";
import { getApiKey, setApiKey, clearApiKey } from "./storage";
import { generateText } from "./gemini";

// Types
type StatusKind = "idle" | "loading" | "error" | "success";

// Helper functions
function getElement<T>(id: string): T {
  const el = document.getElementById(id);

  if (!el) throw new Error(`Missing element #${id}`);

  return el as T;
}

function setStatus(message: string, kind: StatusKind) {
  const status = getElement<HTMLParagraphElement>("status");

  if (!message.trim()) {
    status.innerText = "";
    status.removeAttribute("data-kind");
    return;
  }

  status.innerText = message;
  status.setAttribute("data-kind", kind);
}

function isLeetCodeProblemUrl(url: string | undefined): boolean {
  if (!url) return false;

  try {
    const { hostname, pathname } = new URL(url);

    return hostname === "leetcode.com" && /^\/problems\/[^/]+(\/(description\/?)?)?$/.test(pathname);
  } catch (e) {
    console.error("Failed to parse url.", e);
    return false;
  }
}

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function refreshKeyStatus() {
  const key = await getApiKey();
  keyStatus.innerText = key ? `Key saved (...${key.slice(-4)})` : "No key saved.";
}

// Grab DOM elements
const emptyView = getElement<HTMLDivElement>("empty-view");
const activeView = getElement<HTMLDivElement>("active-view");
const problemTitle = getElement<HTMLHeadingElement>("problem-title");
const result = getElement<HTMLPreElement>("result");
const detectedLang = getElement<HTMLSpanElement>("detected-lang");
const codeLines = getElement<HTMLSpanElement>("code-lines");
const button = getElement<HTMLButtonElement>("generate-btn");
const keyInput = getElement<HTMLInputElement>("api-key-input");
const saveKeyBtn = getElement<HTMLButtonElement>("save-key-btn");
const clearKeyBtn = getElement<HTMLButtonElement>("clear-key-btn");
const keyStatus = getElement<HTMLParagraphElement>("key-status");

// State cache
let cachedProblem: ProblemData | null = null;
let cachedEditor: EditorCode | null = null;
let activeTabId: number | null = null;

async function initPopup() {
  const tab = await getActiveTab();

  if (!tab?.id || !isLeetCodeProblemUrl(tab?.url)) {
    emptyView.hidden = false;
    activeView.hidden = true;
    return;
  }

  activeTabId = tab.id;
  emptyView.hidden = true;
  activeView.hidden = false;

  // Initial loading state in card
  problemTitle.innerText = "Detecting problem...";
  detectedLang.innerText = "Detecting...";
  codeLines.innerText = "Checking editor...";
  button.disabled = true;

  try {
    const [problemResult, editorResult] = await Promise.all([
      requestProblem(tab.id),
      readEditorCode(tab.id),
    ]);

    if (problemResult.ok === false) {
      emptyView.hidden = false;
      activeView.hidden = true;
      setStatus(problemResult.error, "error");
      return;
    }

    if (editorResult.ok === false) {
      emptyView.hidden = false;
      activeView.hidden = true;
      setStatus(editorResult.error, "error");
      return;
    }

    // If code editor doesn't contain suitable amount of codes
    if (editorResult.data.code.trim().length < 20) {
      emptyView.hidden = true;
      activeView.hidden = true;
      setStatus("Couldn't find enough code in the editor. Write your solution first.", "error");
      return;
    }

    cachedProblem = problemResult.data;
    cachedEditor = editorResult.data;

    // Dispaly all the informations
    problemTitle.innerText = cachedProblem.title;
    detectedLang.innerText = cachedEditor.language;

    const lines = cachedEditor.code.trim() ? cachedEditor.code.split("\n").length : 0;
    codeLines.innerText = `${lines} ${lines > 1 ? "lines" : "line"} of code`;

    button.disabled = false;
  } catch (e) {
    emptyView.hidden = false;
    activeView.hidden = true;
    setStatus(`Failed to detect problem: ${String(e)}`, "error");
  }
}

// Click event listener on the generate button
button.addEventListener("click", async () => {
  if (!cachedProblem || !cachedEditor || !activeTabId) {
    setStatus("Problem data not ready.", "error");
    return;
  }

  setStatus("Generating...", "loading");
  button.disabled = true;

  try {
    const res = await generateText("Reply with the single word: pong");

    if (res.ok === false) {
      setStatus(res.error, "error");
      return;
    }

    setStatus(`Gemini responded`, "success");

    result.hidden = false;
    result.textContent = res.text;
  } catch (e) {
    setStatus(`Error: ${String(e)}`, "error");
  } finally {
    button.disabled = false;
  }
});

// Click event listener for api key save button
saveKeyBtn.addEventListener("click", async () => {
  const value = keyInput.value.trim();

  if (!value) {
    keyStatus.innerText = "Paste a key first.";
    return;
  }

  try {
    await setApiKey(value);
    keyInput.value = "";
    await refreshKeyStatus();
  } catch (e) {
    keyStatus.innerText = `Could not save: ${String(e)}`;
  }
});

// Click event listener for api key clear button
clearKeyBtn.addEventListener("click", async () => {
  await clearApiKey();
  await refreshKeyStatus();
});

// Run popup initialization
initPopup();

// Set api key status
refreshKeyStatus();