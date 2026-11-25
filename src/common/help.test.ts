import { beforeEach, describe, expect, it } from 'vitest';
import { createHelp } from './help';

describe('createHelp', () => {
  let help: HTMLElement;
  const button = () => help.querySelector<HTMLButtonElement>('.help-button');
  const dialog = () => help.querySelector<HTMLElement>('.help-dialog');
  const close = () => help.querySelector<HTMLButtonElement>('.help-close');

  beforeEach(() => {
    help = createHelp();
    document.body.append(help);
  });

  it('shows only a small ? button at first, and the notice is hidden', () => {
    expect(button()?.textContent?.trim()).toBe('？');
    expect(button()?.getAttribute('aria-label')).toBe('ほごしゃの方へ');
    expect(dialog()?.hidden).toBe(true);
  });

  it('opens the notice for parents when ? is tapped, including the silent switch', () => {
    button()?.click();
    expect(dialog()?.hidden).toBe(false);
    expect(dialog()?.textContent).toContain('保護者の方へ');
    expect(dialog()?.textContent).toContain('消音ボタン');
  });

  it('closes only with the close button or Escape', () => {
    button()?.click();
    dialog()?.dispatchEvent(new Event('click', { bubbles: true })); // 背景のタッチでは閉じない
    expect(dialog()?.hidden).toBe(false);
    close()?.click();
    expect(dialog()?.hidden).toBe(true);
    button()?.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(dialog()?.hidden).toBe(true);
  });

  it('does not play a voice or send the tap to the game behind it', () => {
    let reached = false;
    document.body.addEventListener('pointerdown', () => {
      reached = true;
    });
    button()?.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(reached).toBe(false);
  });
});
