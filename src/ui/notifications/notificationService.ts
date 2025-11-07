export type NotificationHandler = (message: string) => void;

export interface NotificationHandlers {
  showError: NotificationHandler;
  showSuccess: NotificationHandler;
  showWarning: NotificationHandler;
}

const noop: NotificationHandler = () => undefined;

const defaultHandlers: NotificationHandlers = {
  showError: noop,
  showSuccess: noop,
  showWarning: noop,
};

let handlers: NotificationHandlers = defaultHandlers;

export const setNotificationHandlers = (nextHandlers: NotificationHandlers) => {
  handlers = nextHandlers;
};

export const resetNotificationHandlers = () => {
  handlers = defaultHandlers;
};

export const notificationService = {
  showError: (message: string) => handlers.showError(message),
  showSuccess: (message: string) => handlers.showSuccess(message),
  showWarning: (message: string) => handlers.showWarning(message),
};
