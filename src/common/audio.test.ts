import { describe, expect, it, vi } from 'vitest';
import { createAudio } from './audio';

class FakeSource {
  buffer: unknown = null;
  started = false;
  stopCalls = 0;
  connect = vi.fn();
  start = vi.fn(() => {
    this.started = true;
  });
  stop = vi.fn(() => {
    this.stopCalls++;
  });
  onended: (() => void) | null = null;
}

class FakeContext {
  state = 'suspended';
  destination = {};
  sources: FakeSource[] = [];
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  createBufferSource() {
    const s = new FakeSource();
    this.sources.push(s);
    return s;
  }
  createBuffer(_channels: number, length: number, _rate: number) {
    return { silent: true, length };
  }
  decodeAudioData = vi.fn(async (data: ArrayBuffer) => ({ decodedBytes: data.byteLength }));
}

function makeAudio(fetchDelay?: () => Promise<void>) {
  const context = new FakeContext();
  const fetchFn = vi.fn(async (url: string) => {
    await fetchDelay?.();
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(url.length),
    };
  });
  const audio = createAudio({ context: context as never, fetchFn: fetchFn as never });
  return { audio, context, fetchFn };
}

describe('unlock', () => {
  it('resumes the context and plays a silent buffer', async () => {
    const { audio, context } = makeAudio();
    await audio.unlock();
    expect(context.resume).toHaveBeenCalledTimes(1);
    const silent = context.sources[0];
    expect(silent?.start).toHaveBeenCalledTimes(1);
    expect((silent?.buffer as { silent?: boolean } | null)?.silent).toBe(true);
  });

  it('calls resume synchronously, before any await (the tap must still be the active gesture)', () => {
    const { audio, context } = makeAudio();
    void audio.unlock();
    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(context.sources[0]?.start).toHaveBeenCalledTimes(1);
  });
});

describe('play', () => {
  it('plays the decoded file', async () => {
    const { audio, context, fetchFn } = makeAudio();
    await audio.play('chiiku/voice/dog.wav');
    expect(fetchFn).toHaveBeenCalledWith('chiiku/voice/dog.wav');
    const source = context.sources.at(-1);
    expect(source?.start).toHaveBeenCalledTimes(1);
    expect(source?.connect).toHaveBeenCalledWith(context.destination);
  });

  it('stops the sound that is playing before it plays the next one', async () => {
    const { audio, context } = makeAudio();
    await audio.play('a.wav');
    const first = context.sources.at(-1);
    await audio.play('b.wav');
    expect(first?.stopCalls).toBe(1);
    expect(context.sources.at(-1)?.start).toHaveBeenCalledTimes(1);
  });

  it('plays the same file from the start again when it is played twice', async () => {
    const { audio, context } = makeAudio();
    await audio.play('a.wav');
    await audio.play('a.wav');
    const starts = context.sources.filter((s) => s.started);
    expect(starts).toHaveLength(2);
    expect(starts[0]?.stopCalls).toBe(1);
  });

  it('downloads and decodes a file once', async () => {
    const { audio, context, fetchFn } = makeAudio();
    await audio.play('a.wav');
    await audio.play('a.wav');
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(context.decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it('does not start an older sound that finished loading after a newer tap', async () => {
    let release: (() => void) | undefined;
    let slow = true;
    const { audio, context } = makeAudio(async () => {
      if (slow) {
        slow = false;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      }
    });
    const first = audio.play('slow.wav'); // 読み込みが遅い
    await audio.play('fast.wav'); // 後から叩いた方が先に鳴る
    release?.();
    await first;
    const started = context.sources.filter((s) => s.started);
    expect(started).toHaveLength(1);
  });
});

describe('stop', () => {
  it('stops the sound that is playing', async () => {
    const { audio, context } = makeAudio();
    await audio.play('a.wav');
    audio.stop();
    expect(context.sources.at(-1)?.stopCalls).toBe(1);
  });

  it('does nothing when nothing is playing', () => {
    const { audio } = makeAudio();
    expect(() => audio.stop()).not.toThrow();
  });
});

describe('resume on tap', () => {
  it('resumes a context that iOS has interrupted (phone call, screen lock)', async () => {
    const { audio, context } = makeAudio();
    context.state = 'interrupted';
    await audio.play('a.wav');
    expect(context.resume).toHaveBeenCalledTimes(1);
  });

  it('resumes a suspended context', async () => {
    const { audio, context } = makeAudio();
    context.state = 'suspended';
    await audio.play('a.wav');
    expect(context.resume).toHaveBeenCalledTimes(1);
  });

  it('does not call resume while the context is running', async () => {
    const { audio, context } = makeAudio();
    context.state = 'running';
    await audio.play('a.wav');
    expect(context.resume).not.toHaveBeenCalled();
  });
});

describe('audio session (iOS silent switch)', () => {
  const nav = navigator as unknown as { audioSession?: { type: string } };

  afterEach(() => {
    delete nav.audioSession;
  });

  it('sets the session to playback inside unlock, so the silent switch does not mute the voice', () => {
    nav.audioSession = { type: 'auto' };
    const { audio } = makeAudio();
    void audio.unlock();
    // await の前（タッチの処理の中）で済んでいる
    expect(nav.audioSession.type).toBe('playback');
  });

  it('does nothing on a browser that has no audioSession', async () => {
    const { audio, context } = makeAudio();
    await expect(audio.unlock()).resolves.toBeUndefined();
    expect(context.resume).toHaveBeenCalledTimes(1);
  });

  it('still unlocks when setting the session throws', async () => {
    Object.defineProperty(navigator, 'audioSession', {
      configurable: true,
      value: {
        set type(_v: string) {
          throw new Error('not allowed');
        },
      },
    });
    const { audio, context } = makeAudio();
    await expect(audio.unlock()).resolves.toBeUndefined();
    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(context.sources[0]?.start).toHaveBeenCalledTimes(1);
  });
});
