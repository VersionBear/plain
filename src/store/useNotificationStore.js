import { create } from 'zustand';

const DEFAULT_AUTO_DISMISS_DURATION = 4000;
const ERROR_AUTO_DISMISS_DURATION = 8000;

export const notificationTypes = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
};

export const useNotificationStore = create((set) => ({
  notifications: [],

  addNotification(notification) {
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const autoDismiss = notification.autoDismiss ??
      (notification.type === notificationTypes.ERROR ? ERROR_AUTO_DISMISS_DURATION : DEFAULT_AUTO_DISMISS_DURATION);

    set((state) => ({
      notifications: [...state.notifications, { ...notification, id, createdAt: Date.now() }],
    }));

    if (autoDismiss > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, autoDismiss);
    }

    return id;
  },

  dismissNotification(id) {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  dismissAll() {
    set({ notifications: [] });
  },

  // Convenience methods for common notifications
  showSuccess(message, options = {}) {
    return this.addNotification({
      type: notificationTypes.SUCCESS,
      message,
      ...options,
    });
  },

  showInfo(message, options = {}) {
    return this.addNotification({
      type: notificationTypes.INFO,
      message,
      ...options,
    });
  },

  showWarning(message, options = {}) {
    return this.addNotification({
      type: notificationTypes.WARNING,
      message,
      ...options,
    });
  },

  showError(message, options = {}) {
    return this.addNotification({
      type: notificationTypes.ERROR,
      message,
      autoDismiss: ERROR_AUTO_DISMISS_DURATION,
      ...options,
    });
  },
}));
