export interface EditorCode {
    code: string;
    language: string;
}

export type EditorCodeResult =
    | { ok: true; data: EditorCode; }
    | { ok: false; error: string; }

function readMonacoCode():
    | EditorCode
    | { error: string } {
    const monaco = (window as any).monaco;

    if (!monaco?.editor) return { error: "Editor not found on this page." };

    const models: any[] = monaco.editor.getModels();
    const model = models.find((m) => m.getLanguageId() !== "plaintext");

    if (!model) return { error: "No code editor model found." };

    return { code: model.getValue(), language: model.getLanguageId() };
}

export async function readEditorCode(tabId: number): Promise<EditorCodeResult> {
    try {
        const [injection] = await chrome.scripting.executeScript({
            target: { tabId },
            world: "MAIN",
            func: readMonacoCode
        });

        const result = injection?.result;

        if (!result) return { ok: false, error: "No result from the page." };
        if ("error" in result) return { ok: false, error: result.error };

        return { ok: true, data: result };
    } catch (e) {
        return { ok: false, error: `Could not read the editor: ${String(e)}` };
    }
}