/**
 * ui-kit English catalogue. Keys are namespaced `ui.<component>.<name>`.
 * Keep labels short: Tamil/Malayalam may run 40% longer.
 */
export const en = {
  "ui.dialog.close": "Close",
  "ui.toast.dismiss": "Dismiss",
  "ui.toast.region": "Notifications",
  "ui.shell.skip": "Skip to content",
  "ui.offline.offline": "You are offline. Changes are disabled.",
  "ui.offline.unreachable": "Cannot reach the server.",
  "ui.table.loading": "Loading",
  "ui.password.show": "Show",
  "ui.password.hide": "Hide",
} as const satisfies Record<string, string>;
