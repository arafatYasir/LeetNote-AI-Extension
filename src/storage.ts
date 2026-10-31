const API_KEY_STORAGE_KEY = "geminiApiKey";

export async function getApiKey(): Promise<string | null> {
    const result = await chrome.storage.local.get(API_KEY_STORAGE_KEY);
    const value = result[API_KEY_STORAGE_KEY];

    return typeof value === "string" && value.trim() ? value : null;
}

export async function setApiKey(key: string): Promise<void> {
    await chrome.storage.local.set({ [API_KEY_STORAGE_KEY]: key.trim() });
}

export async function clearApiKey(): Promise<void> {
    await chrome.storage.local.remove(API_KEY_STORAGE_KEY);
}