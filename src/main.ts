import { readEditorCode } from "./editorCode";
import { requestProblem } from "./problem";
import "./style.css"

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
    throw new Error("Status message is not found!");
  }

  status.innerText = message;
  status.setAttribute("data-kind", kind);
}

function isLeetCodeProblemUrl(url: string | undefined): boolean {
  if (!url) return false;

  try {
    const { hostname, pathname } = new URL(url);
    const urlRegex = /^\/problems\/[^/]+(\/(description\/?)?)?$/;

    return hostname === "leetcode.com" && urlRegex.test(pathname);
  }
  catch (e) {
    console.error("Failed to parse url.", e);
    return false;
  }
}

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

// Grab DOM elements
const button = getElement<HTMLButtonElement>("generate-btn");

// Click event listener on the generate button
button.addEventListener("click", async () => {
  setStatus("Reading...", "loading");

  const tab = await getActiveTab();

  if (!isLeetCodeProblemUrl(tab?.url) || tab?.id === undefined) {
    setStatus("Open a LeetCode problem description page.", "error");
    return;
  }

  const result = await readEditorCode(tab.id);

  if (result.ok === false) {
    setStatus(result.error, "error");
    return;
  }

  const problem = await requestProblem(tab.id);

  if (problem.ok === false) {
    setStatus(problem.error, "error");
    return;
  }

  const lineCount = result.data.code.split("\n").length;

  setStatus(`Problem: ${problem.data.title}, Language: ${result.data.language}, Lines: ${lineCount}`, "success");
});