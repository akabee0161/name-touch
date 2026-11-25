import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachLongPress } from './long-press';

function fire(el: Element, type: string) {
  el.dispatchEvent(new Event(type, { bubbles: true }));
}

describe('attachLongPress', () => {
  let el: HTMLElement;
  let onFire: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    el = document.createElement('button');
    onFire = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires after 1500ms', () => {
    attachLongPress(el, 1500, onFire);
    fire(el, 'pointerdown');
    vi.advanceTimersByTime(1499);
    expect(onFire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onFire).toHaveBeenCalledTimes(1);
  });

  it('short tap does not exit', () => {
    attachLongPress(el, 1500, onFire);
    fire(el, 'pointerdown');
    vi.advanceTimersByTime(800);
    fire(el, 'pointerup');
    vi.advanceTimersByTime(5000);
    expect(onFire).not.toHaveBeenCalled();
  });

  it('pointerleave cancels', () => {
    attachLongPress(el, 1500, onFire);
    fire(el, 'pointerdown');
    vi.advanceTimersByTime(1000);
    fire(el, 'pointerleave');
    vi.advanceTimersByTime(5000);
    expect(onFire).not.toHaveBeenCalled();
  });

  it('pointercancel cancels', () => {
    attachLongPress(el, 1500, onFire);
    fire(el, 'pointerdown');
    vi.advanceTimersByTime(1000);
    fire(el, 'pointercancel');
    vi.advanceTimersByTime(5000);
    expect(onFire).not.toHaveBeenCalled();
  });

  it('fires only once for one press', () => {
    attachLongPress(el, 1500, onFire);
    fire(el, 'pointerdown');
    vi.advanceTimersByTime(10000);
    expect(onFire).toHaveBeenCalledTimes(1);
  });

  it('a second press after a cancelled one counts from zero', () => {
    attachLongPress(el, 1500, onFire);
    fire(el, 'pointerdown');
    vi.advanceTimersByTime(1000);
    fire(el, 'pointerup');
    fire(el, 'pointerdown');
    vi.advanceTimersByTime(1000);
    expect(onFire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(onFire).toHaveBeenCalledTimes(1);
  });

  it('a second finger pressing again does not restart or double the count', () => {
    attachLongPress(el, 1500, onFire);
    fire(el, 'pointerdown');
    vi.advanceTimersByTime(1000);
    fire(el, 'pointerdown');
    vi.advanceTimersByTime(500);
    expect(onFire).toHaveBeenCalledTimes(1);
  });

  it('the returned function detaches it', () => {
    const detach = attachLongPress(el, 1500, onFire);
    detach();
    fire(el, 'pointerdown');
    vi.advanceTimersByTime(5000);
    expect(onFire).not.toHaveBeenCalled();
  });

  it('detaching during a press cancels it', () => {
    const detach = attachLongPress(el, 1500, onFire);
    fire(el, 'pointerdown');
    vi.advanceTimersByTime(1000);
    detach();
    vi.advanceTimersByTime(5000);
    expect(onFire).not.toHaveBeenCalled();
  });
});
