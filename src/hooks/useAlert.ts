'use client';

import { useAlertContext, type ShowAlertOptions } from '@/context/AlertContext';

/**
 * Access the global alert bus.
 *
 * Example:
 * ```tsx
 * const { showAlert } = useAlert();
 *
 * async function handleSubmit() {
 *   try {
 *     await saveSettings();
 *     showAlert({ variant: 'success', title: 'Saved', message: 'Settings updated.' });
 *   } catch {
 *     showAlert({ variant: 'error', title: 'Update failed', message: 'Please retry.' });
 *   }
 * }
 * ```
 */
const useAlert = () => {
  const { showAlert, dismissAlert, clearAlerts } = useAlertContext();

  return {
    showAlert,
    success: (title: ShowAlertOptions['title'], message: ShowAlertOptions['message']) =>
      showAlert({ variant: 'success', title, message }),
    error: (title: ShowAlertOptions['title'], message: ShowAlertOptions['message']) =>
      showAlert({ variant: 'error', title, message }),
    info: (title: ShowAlertOptions['title'], message: ShowAlertOptions['message']) =>
      showAlert({ variant: 'info', title, message }),
    dismissAlert,
    clearAlerts,
  };
};

export default useAlert;
export type { ShowAlertOptions, AlertVariant, AlertText, BilingualText } from '@/context/AlertContext';
