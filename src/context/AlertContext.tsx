'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import Alert from '@/components/ui/alert/Alert';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface ShowAlertOptions {
  variant: AlertVariant;
  title: string;
  message: string;
  showLink?: boolean;
  linkHref?: string;
  linkText?: string;
  /**
   * Auto-dismiss duration in milliseconds. Pass 0 to keep it open until dismissed manually.
   */
  duration?: number;
}

interface ActiveAlert extends ShowAlertOptions {
  id: string;
}

interface AlertContextValue {
  alerts: ActiveAlert[];
  showAlert: (options: ShowAlertOptions) => string;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
}

const DEFAULT_DURATION = 4500;

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

const generateAlertId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `alert-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const AlertProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissAlert = useCallback((id: string) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));

    const timeout = timeoutsRef.current[id];
    if (timeout) {
      clearTimeout(timeout);
      delete timeoutsRef.current[id];
    }
  }, []);

  const clearAlerts = useCallback(() => {
    Object.values(timeoutsRef.current).forEach(clearTimeout);
    timeoutsRef.current = {};
    setAlerts([]);
  }, []);

  const showAlert = useCallback(
    (options: ShowAlertOptions) => {
      const id = generateAlertId();
      const duration =
        typeof options.duration === 'number' ? Math.max(0, options.duration) : DEFAULT_DURATION;

      setAlerts((current) => [...current, { ...options, id }]);

      if (duration > 0 && Number.isFinite(duration)) {
        timeoutsRef.current[id] = setTimeout(() => dismissAlert(id), duration);
      }

      return id;
    },
    [dismissAlert],
  );

  const value = useMemo<AlertContextValue>(
    () => ({
      alerts,
      showAlert,
      dismissAlert,
      clearAlerts,
    }),
    [alerts, showAlert, dismissAlert, clearAlerts],
  );

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertViewport alerts={alerts} onDismiss={dismissAlert} />
    </AlertContext.Provider>
  );
};

export const useAlertContext = () => {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error('useAlertContext must be used within an AlertProvider');
  }

  return context;
};

type AlertComponentProps = React.ComponentProps<typeof Alert>;

const pickAlertProps = (alert: ActiveAlert): AlertComponentProps => {
  const alertProps: Partial<ActiveAlert> = { ...alert };
  delete alertProps.duration;
  delete alertProps.id;
  return alertProps as AlertComponentProps;
};

const AlertViewport: React.FC<{
  alerts: ActiveAlert[];
  onDismiss: (id: string) => void;
}> = ({ alerts, onDismiss }) => {
  if (!alerts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-3 px-4 sm:items-end sm:px-6">
      {alerts.map((alert) => (
        <div key={alert.id} className="pointer-events-auto relative w-full max-w-sm drop-shadow-lg transition-all duration-200">
          <Alert {...pickAlertProps(alert)} />
          <button
            type="button"
            aria-label="Dismiss alert"
            className="absolute right-3 top-3 rounded-full p-1 text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-white"
            onClick={() => onDismiss(alert.id)}
          >
            <span aria-hidden>&times;</span>
          </button>
        </div>
      ))}
    </div>
  );
};

export default AlertContext;
