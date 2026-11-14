/**
 * Workspace UI mode.
 *
 * `simple` is the beginner surface: one real detector plane at a time, no
 * channel machinery, an explicit "build spectrum" step. `advanced` is the full
 * instrument view with official channel isolation, masks and native sampling.
 *
 * The URL wins (so embeds are reproducible); otherwise the last choice is
 * remembered; first-time visitors start simple.
 */

export type UiMode = 'simple' | 'advanced';

export const UI_MODE_STORAGE_KEY = 'spherex.uiMode';

export function readStoredUiMode(): UiMode {
  try {
    const value = window.localStorage.getItem(UI_MODE_STORAGE_KEY);
    return value === 'advanced' ? 'advanced' : 'simple';
  } catch {
    return 'simple';
  }
}

export function storeUiMode(mode: UiMode): void {
  try {
    window.localStorage.setItem(UI_MODE_STORAGE_KEY, mode);
  } catch {
    // private mode or a disabled storage: the URL still carries the mode
  }
}
