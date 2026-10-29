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

// Grab DOM elements
const button = getElement<HTMLButtonElement>("generate-btn");
// const result = getElement<HTMLPreElement>("result");

// Click event listener on the generate button
button.addEventListener("click", () => {
  setStatus("Button works!", "success");
});