# Privacy Policy

_Last updated: 2026-05-13_

**AI Usage Bars — for Claude.ai** (the "extension") respects your privacy. This policy explains what data the extension handles, what it stores, and what it never does.

## What data the extension reads

The extension reads only **your own Claude.ai usage data** by calling these two endpoints on `claude.ai`, both authenticated by the session cookie that already exists in your browser:

- `GET https://claude.ai/api/organizations` — to discover your active organization's UUID.
- `GET https://claude.ai/api/organizations/{uuid}/usage` — to read the percentages and reset timestamps for your 5-hour session and 7-day weekly windows.

The browser attaches your existing `claude.ai` session cookie to these requests automatically. **The extension never reads, stores, or transmits the cookie itself.**

## What data is stored locally

The extension stores the following exclusively in `chrome.storage.local`, which is sandboxed to the extension and never synchronized with any remote server:

- The most recent usage snapshot (percentages and reset timestamps).
- Your selected refresh interval (1, 5 or 15 minutes).
- Your active Claude organization UUID, cached so the extension does not need to re-discover it on every refresh.

This data **never leaves your browser**.

## What data is collected, sold or shared

**None.** The extension:

- Does **not** collect personally identifiable information.
- Does **not** collect health, financial, authentication, communication or location data.
- Does **not** collect web history or website content.
- Does **not** track user activity, clicks, scrolling or any analytics.
- Does **not** set or read cookies of its own.
- Does **not** include third-party trackers, analytics scripts or advertising SDKs.
- Does **not** sell, share or transfer any data to third parties.
- Does **not** use any data for advertising, profiling, or creditworthiness / lending decisions.

## No remote code

All code executed by the extension is bundled inside the published package. The extension does not download, evaluate or otherwise execute remote JavaScript. The only network requests it makes are to `claude.ai`, to read your own usage data as described above.

## Permissions

The extension requests only the minimum permissions necessary:

- `storage` — to cache the usage snapshot and your preferences locally.
- `alarms` — to schedule periodic background refreshes (MV3 service workers cannot use `setInterval`).
- Host permission for `https://claude.ai/*` — so that fetch requests to claude.ai automatically include your existing session cookie.

## Data retention

Locally stored data lives in `chrome.storage.local` until:

- You uninstall the extension (Chrome clears its storage automatically).
- You clear it manually via Chrome's settings.
- You sign out of `claude.ai` and the cached organization UUID becomes invalid (the extension re-discovers it on the next request).

There is no remote retention because no data ever leaves your device.

## Third-party services

The extension communicates with a **single** third-party service: Anthropic's `claude.ai`, owned and operated by Anthropic, PBC. This is required for the extension's only purpose: reading your own Claude usage. Anthropic's own privacy policy applies to any data they hold about your account: https://www.anthropic.com/legal/privacy

The extension is **not affiliated with, sponsored by or endorsed by Anthropic**. "Claude" is a trademark of Anthropic, PBC.

## Open source

The full source code of the extension is available at https://github.com/brassoy/ai-usage-bars and licensed under MIT. You can audit every line of code that runs.

## Changes to this policy

If this policy ever changes, the updated version will be committed to the repository above. The `Last updated` date at the top of this document reflects the most recent change.

## Contact

For questions or issues, please open an issue on the repository:
https://github.com/brassoy/ai-usage-bars/issues

---

© 2026 Pablo Ruiz · MIT License
