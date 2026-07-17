declare global {
  interface Window {
    showToast?: (msg: string, type?: "success" | "error" | "info") => void;
  }
}

export {};
