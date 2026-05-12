import type { Provider } from './types';
import { claudeProvider } from './claude';
import { mockClaude } from './mock';

// Flip to true to develop the UI against fake usage data without hitting
// the real claude.ai endpoint.
export const USE_MOCKS = false;

export const providers: Provider[] = USE_MOCKS ? [mockClaude] : [claudeProvider];
