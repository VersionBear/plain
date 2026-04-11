import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { useNotificationStore, notificationTypes } from '../../store/useNotificationStore';
import clsx from 'clsx';

const typeConfig = {
  [notificationTypes.SUCCESS]: {
    icon: CheckCircle,
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
    iconClass: 'text-emerald-500',
    textClass: 'text-emerald-700 dark:text-emerald-300',
  },
  [notificationTypes.INFO]: {
    icon: Info,
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    iconClass: 'text-blue-500',
    textClass: 'text-blue-700 dark:text-blue-300',
  },
  [notificationTypes.WARNING]: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    iconClass: 'text-amber-500',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  [notificationTypes.ERROR]: {
    icon: AlertCircle,
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/30',
    iconClass: 'text-red-500',
    textClass: 'text-red-700 dark:text-red-300',
  },
};

function NotificationToast({ notification, onDismiss }) {
  const config = typeConfig[notification.type] ?? typeConfig[notificationTypes.INFO];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={clsx(
        'flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-panel backdrop-blur-xl',
        config.bgClass,
        config.borderClass,
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className={clsx('h-5 w-5 shrink-0', config.iconClass)} strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <p className={clsx('text-sm leading-relaxed', config.textClass)}>
          {notification.message}
        </p>
        {notification.action && (
          <button
            type="button"
            onClick={notification.action.onClick}
            className="mt-2 text-xs font-medium text-accent underline underline-offset-2 hover:text-accent/80"
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(notification.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-lg p-1 text-muted/60 transition-colors hover:bg-black/5 hover:text-ink"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function NotificationContainer() {
  const notifications = useNotificationStore((state) => state.notifications);
  const dismissNotification = useNotificationStore((state) => state.dismissNotification);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-start gap-2 p-4 pt-16 md:pt-20"
      aria-label="Notifications"
    >
      <div className="pointer-events-auto flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <NotificationToast
              key={notification.id}
              notification={notification}
              onDismiss={dismissNotification}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
