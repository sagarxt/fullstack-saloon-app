let toastRef = null;

export const setToastRef = (ref) => {
  toastRef = ref;
};

export const toastEmitter = {
  success: (msg, title) => toastRef?.(msg, "success", title),
  error: (msg, title) => toastRef?.(msg, "error", title),
  warning: (msg, title) => toastRef?.(msg, "warning", title),
  info: (msg, title) => toastRef?.(msg, "info", title),
  show: (msg, type = "info", title) => toastRef?.(msg, type, title),
};
