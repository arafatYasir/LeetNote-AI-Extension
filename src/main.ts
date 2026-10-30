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

    return hostname === "leetcode.com" && pathname.startsWith("/problems/");
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
// const result = getElement<HTMLPreElement>("result");

// Click event listener on the generate button
button.addEventListener("click", async () => {
  const tab = await getActiveTab();
  const isProblemUrl = isLeetCodeProblemUrl(tab?.url);

  if (isProblemUrl) {
    setStatus(`Problem page detected: ${tab?.url}`, "success");
  }
  else {
    setStatus("Open a LeetCode problem page first.", "error");
  }
});