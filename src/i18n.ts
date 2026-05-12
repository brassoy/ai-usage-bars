// Tiny i18n helper around chrome.i18n.
//
// - `t(key, ...subs)` returns the localized message with positional
//   placeholders. Falls back to the key if the message is missing.
// - `localizeDom(root)` scans the DOM for `data-i18n="key"` elements and
//   either sets textContent or specific attributes if `data-i18n-target`
//   is set (space-separated attribute names).

export function t(key: string, ...subs: string[]): string {
  const msg = chrome.i18n.getMessage(key, subs.length ? subs : undefined);
  return msg || key;
}

export function localizeDom(root: ParentNode = document): void {
  if (root === document) {
    const ui = chrome.i18n.getUILanguage();
    document.documentElement.lang = ui;
    if (/^(ar|he|fa|ur)\b/i.test(ui)) {
      document.documentElement.dir = 'rtl';
    }
  }
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (!key) return;
    const msg = chrome.i18n.getMessage(key);
    if (!msg) return;
    const targets = (el.dataset.i18nTarget || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (targets.length === 0) {
      el.textContent = msg;
    } else {
      for (const attr of targets) {
        el.setAttribute(attr, msg);
      }
    }
  });
}
