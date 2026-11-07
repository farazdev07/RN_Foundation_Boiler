export type ToastVariant = 'info' | 'success' | 'error';

export type Toast = { id: number; message: string; variant: ToastVariant };

type Listener = () => void;

let toast: Toast | null = null;
let nextId = 1;
// Mounted viewports, newest last. Only the newest shows the toast, so one shown
// while a modal is open appears inside the modal instead of behind it.
let viewports: number[] = [];
const listeners = new Set<Listener>();

const emit = () => listeners.forEach(listener => listener());

export const toastStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getToast: (): Toast | null => toast,
  isTopViewport: (id: number): boolean => viewports.at(-1) === id,
  show(message: string, variant: ToastVariant): void {
    toast = { id: nextId++, message, variant };
    emit();
  },
  hide(id?: number): void {
    if (id === undefined || toast?.id === id) {
      toast = null;
      emit();
    }
  },
  registerViewport(): { id: number; unregister: () => void } {
    const id = nextId++;
    viewports = [...viewports, id];
    emit();
    return {
      id,
      unregister: () => {
        viewports = viewports.filter(viewport => viewport !== id);
        emit();
      },
    };
  },
};

export const showToast = (
  message: string,
  variant: ToastVariant = 'info',
): void => toastStore.show(message, variant);

export const hideToast = (): void => toastStore.hide();
