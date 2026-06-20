import { toast as hotToast } from 'react-hot-toast';
import type { ToastOptions } from 'react-hot-toast';

interface ToastType {
  (message: string, options?: ToastOptions): string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  loading: (message: string, options?: ToastOptions) => string;
  dismiss: (toastId?: string) => void;
}

const showToast: ToastType = Object.assign(
  (message: string, options?: ToastOptions) => hotToast(message, options),
  {
    success: (message: string, options?: ToastOptions) => hotToast.success(message, options),
    error: (message: string, options?: ToastOptions) => hotToast.error(message, options),
    loading: (message: string, options?: ToastOptions) => hotToast.loading(message, options),
    dismiss: (toastId?: string) => hotToast.dismiss(toastId),
  }
);

export { showToast as toast };
