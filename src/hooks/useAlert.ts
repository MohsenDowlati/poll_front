'use client';

import { useAlertContext } from '@/context/AlertContext';

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
    dismissAlert,
    clearAlerts,
  };
};

export default useAlert;
export type { ShowAlertOptions, AlertVariant } from '@/context/AlertContext';
