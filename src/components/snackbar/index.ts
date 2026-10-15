import { toast as sonnerToast } from 'sonner';

export * from 'sonner';
export * from './snackbar';

/**
 * Enhanced toast wrapper providing automatic deduplication for rapid identical messages,
 * ensuring toasts remain non-intrusive on mobile and desktop without spamming the screen.
 */
const wrapToastMethod =
  (fn: (...args: any[]) => any) =>
  (message: any, data?: any) => {
    // If id is explicitly provided, respect it; otherwise use message string as default id to deduplicate
    const id = data?.id !== undefined ? data.id : typeof message === 'string' ? message : undefined;
    const options = id !== undefined ? { id, ...data } : data;
    return fn(message, options);
  };

const customToast: any = wrapToastMethod(sonnerToast);
customToast.success = wrapToastMethod(sonnerToast.success);
customToast.error = wrapToastMethod(sonnerToast.error);
customToast.info = wrapToastMethod(sonnerToast.info);
customToast.warning = wrapToastMethod(sonnerToast.warning);
customToast.message = wrapToastMethod(sonnerToast.message);
customToast.loading = wrapToastMethod(sonnerToast.loading);
customToast.promise = sonnerToast.promise;
customToast.custom = sonnerToast.custom;
customToast.dismiss = sonnerToast.dismiss;

export const toast = customToast as typeof sonnerToast;
