export interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

let current = $state<Toast | null>(null);
let nextId = 0;

/** The one toast the dashboard shows at a time, rendered by Toasts.svelte. */
export const toast = {
  get current() {
    return current;
  },
  success(message: string) {
    current = { id: ++nextId, message, type: "success" };
  },
  error(message: string) {
    current = { id: ++nextId, message, type: "error" };
  },
  dismiss() {
    current = null;
  },
};
