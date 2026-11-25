import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseItems } from '../common/assets';
import { type AudioPlayer, createAudio } from '../common/audio';
import { startNameTouch } from './name-touch';

const file = parseItems(JSON.parse(readFileSync('public/chiiku/items.json', 'utf-8')));

function fakeAudio() {
  const audio = {
    unlock: vi.fn(async () => {}),
    play: vi.fn(async (_url: string) => {}),
    preload: vi.fn((_urls: string[]) => {}),
    stop: vi.fn(),
  };
  return audio satisfies AudioPlayer;
}

function fire(el: Element | null | undefined, type: string) {
  if (!el) throw new Error(`${type} を送る相手が無い`);
  el.dispatchEvent(new Event(type, { bubbles: true }));
}

describe('startNameTouch', () => {
  let root: HTMLElement;
  let audio: ReturnType<typeof fakeAudio>;
  let onExit: ReturnType<typeof vi.fn>;

  const item = (id: string) => root.querySelector<HTMLElement>(`.item[data-id="${id}"]`);
  const left = () => root.querySelector<HTMLElement>('.arrow-left');
  const right = () => root.querySelector<HTMLElement>('.arrow-right');
  const ids = () => [...root.querySelectorAll<HTMLElement>('.item')].map((e) => e.dataset.id);

  beforeEach(() => {
    vi.useFakeTimers();
    root = document.createElement('div');
    audio = fakeAudio();
    onExit = vi.fn();
    startNameTouch(root, { file, audio, onExit });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the first page: six animals', () => {
    expect(ids()).toEqual(['dog', 'cat', 'cow', 'pig', 'chicken', 'elephant']);
  });

  it('lays the items out in columns and rows that fit the count of each page', () => {
    const layout = () => {
      const grid = root.querySelector<HTMLElement>('.items');
      return [grid?.style.getPropertyValue('--cols'), grid?.style.getPropertyValue('--rows')];
    };
    expect(layout()).toEqual(['3', '2']); // どうぶつ 6
    right()?.click();
    expect(layout()).toEqual(['3', '1']); // むし 3
    for (let i = 0; i < 2; i++) right()?.click();
    expect(layout()).toEqual(['2', '2']); // やさい 4
    right()?.click();
    expect(layout()).toEqual(['3', '2']); // たべもの 5（3 + 2）
  });

  it('item buttons are pictures only (no text)', () => {
    for (const button of root.querySelectorAll('.item')) {
      expect(button.textContent?.trim()).toBe('');
      expect(button.querySelector('img')?.getAttribute('src')).toMatch(/chiiku\/img\/.+\.webp$/);
    }
  });

  it('tapping an item plays its voice', () => {
    fire(item('dog'), 'pointerdown');
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(audio.play.mock.calls[0]?.[0]).toMatch(/chiiku\/voice\/dog\.wav$/);
  });

  it('tapping an item makes it bounce for 0.4 seconds', () => {
    fire(item('dog'), 'pointerdown');
    expect(item('dog')?.classList.contains('bounce')).toBe(true);
    vi.advanceTimersByTime(399);
    expect(item('dog')?.classList.contains('bounce')).toBe(true);
    vi.advanceTimersByTime(1);
    expect(item('dog')?.classList.contains('bounce')).toBe(false);
  });

  it('tapping again restarts the voice and the bounce', () => {
    fire(item('dog'), 'pointerdown');
    vi.advanceTimersByTime(300);
    fire(item('dog'), 'pointerdown');
    expect(audio.play).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(399);
    // 2 回目の叩きから数え直す（最初の叩きから 0.4 秒たっていても、まだ跳ねている）
    expect(item('dog')?.classList.contains('bounce')).toBe(true);
    vi.advanceTimersByTime(1);
    expect(item('dog')?.classList.contains('bounce')).toBe(false);
  });

  it('tapping another item plays that voice', () => {
    fire(item('dog'), 'pointerdown');
    fire(item('cat'), 'pointerdown');
    expect(audio.play.mock.calls.map((c) => c[0])).toEqual([
      expect.stringMatching(/voice\/dog\.wav$/),
      expect.stringMatching(/voice\/cat\.wav$/),
    ]);
  });

  it('a voice that fails to load does not break the game', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    audio.play.mockRejectedValueOnce(new Error('読み込めない'));
    fire(item('dog'), 'pointerdown');
    await vi.advanceTimersByTimeAsync(0);
    expect(logged).toHaveBeenCalledTimes(1); // 握りつぶさず、ログには残す
    expect(() => fire(item('cat'), 'pointerdown')).not.toThrow();
    logged.mockRestore();
  });

  it('a right or middle mouse click does not play a voice', () => {
    for (const button of [1, 2]) {
      item('dog')?.dispatchEvent(
        Object.assign(new Event('pointerdown', { bubbles: true }), { button }),
      );
    }
    expect(audio.play).not.toHaveBeenCalled();
    // 左クリック・タッチ・ペン（button 0）は鳴る
    item('dog')?.dispatchEvent(
      Object.assign(new Event('pointerdown', { bubbles: true }), { button: 0 }),
    );
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it('preloads the voices of the page that is shown, and of the next page when it turns', () => {
    expect(audio.preload).toHaveBeenCalledTimes(1);
    expect(audio.preload.mock.calls[0]?.[0]).toHaveLength(6);
    expect(audio.preload.mock.calls[0]?.[0]?.[0]).toMatch(/chiiku\/voice\/dog\.wav$/);
    right()?.click();
    expect(audio.preload).toHaveBeenCalledTimes(2);
    expect(audio.preload.mock.calls[1]?.[0]).toHaveLength(3); // むし 3
    expect(audio.preload.mock.calls[1]?.[0]?.[0]).toMatch(/chiiku\/voice\/butterfly\.wav$/);
  });

  it('Enter on an item (keyboard on a PC) plays its voice once', () => {
    item('dog')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it('arrows hidden at ends', () => {
    expect(left()).toBeNull();
    expect(right()).not.toBeNull();
    for (let i = 0; i < 4; i++) right()?.click();
    expect(right()).toBeNull();
    expect(left()).not.toBeNull();
  });

  it('both arrows show on a middle page', () => {
    right()?.click();
    expect(left()).not.toBeNull();
    expect(right()).not.toBeNull();
  });

  it('turning the page shows that page and stops the voice', () => {
    right()?.click();
    expect(ids()).toEqual(['butterfly', 'ladybug', 'dragonfly']);
    expect(audio.stop).toHaveBeenCalled();
    left()?.click();
    expect(ids()).toEqual(['dog', 'cat', 'cow', 'pig', 'chicken', 'elephant']);
  });

  it('the last page is food: five items', () => {
    for (let i = 0; i < 4; i++) right()?.click();
    expect(ids()).toEqual(['apple', 'banana', 'strawberry', 'bread', 'spaghetti']);
  });

  it('long press exits', () => {
    const exit = root.querySelector('.exit-button');
    fire(exit, 'pointerdown');
    vi.advanceTimersByTime(1499);
    expect(onExit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(audio.stop).toHaveBeenCalled();
  });

  it('a short tap on the exit button does not exit', () => {
    const exit = root.querySelector('.exit-button');
    fire(exit, 'pointerdown');
    vi.advanceTimersByTime(800);
    fire(exit, 'pointerup');
    vi.advanceTimersByTime(3000);
    expect(onExit).not.toHaveBeenCalled();
  });

  it('keeps no record anywhere', () => {
    fire(item('dog'), 'pointerdown');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});

describe('startNameTouch with the real audio player', () => {
  it('tapping the same picture again stops the earlier voice and plays again from the start', async () => {
    const sources: { started: boolean; stopCalls: number }[] = [];
    const context = {
      state: 'running',
      destination: {},
      resume: async () => {},
      createBuffer: () => ({}),
      decodeAudioData: async () => ({}),
      createBufferSource: () => {
        const s = {
          buffer: null as unknown,
          onended: null as (() => void) | null,
          started: false,
          stopCalls: 0,
          connect: () => {},
          start() {
            s.started = true;
          },
          stop() {
            s.stopCalls++;
          },
        };
        sources.push(s);
        return s;
      },
    };
    const audio = createAudio({
      context: context as never,
      fetchFn: (async () => ({
        ok: true,
        status: 200,
        arrayBuffer: async () => new ArrayBuffer(1),
      })) as never,
    });
    const root = document.createElement('div');
    startNameTouch(root, { file, audio, onExit: () => {} });
    const dog = root.querySelector('.item[data-id="dog"]');

    fire(dog, 'pointerdown');
    await new Promise((r) => setTimeout(r, 0));
    fire(dog, 'pointerdown');
    await new Promise((r) => setTimeout(r, 0));

    const started = sources.filter((s) => s.started);
    expect(started).toHaveLength(2);
    expect(started[0]?.stopCalls).toBe(1); // 前の声は止まった
    expect(started[1]?.stopCalls).toBe(0); // 後の声が鳴っている
  });
});
