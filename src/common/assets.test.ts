import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadItems } from './assets';

const REAL_JSON = readFileSync('public/chiiku/items.json', 'utf-8');

function stubFetch(body: string, init: { ok?: boolean; status?: number } = {}) {
  const fn = vi.fn(async () => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => JSON.parse(body),
  }));
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadItems', () => {
  it('returns the 21 items and 5 categories of the real items.json', async () => {
    const fetchFn = stubFetch(REAL_JSON);
    const file = await loadItems('/play/name-touch/chiiku/items.json');
    expect(fetchFn).toHaveBeenCalledWith('/play/name-touch/chiiku/items.json');
    expect(file.items).toHaveLength(21);
    expect(file.categories.map((c) => c.key)).toEqual([
      'animal',
      'insect',
      'sea',
      'vegetable',
      'food',
    ]);
    expect(file.items[0]).toEqual({
      id: 'dog',
      category: 'animal',
      label: 'いぬ',
      kana: 'いぬ',
      reading: 'いぬ',
    });
  });

  it('names the broken field: items[3].kana missing', async () => {
    const data = JSON.parse(REAL_JSON);
    data.items[3].kana = undefined; // JSON にすると、この項目は無くなる
    stubFetch(JSON.stringify(data));
    await expect(loadItems('/items.json')).rejects.toThrow('items[3].kana');
  });

  it('names the broken field: category that is not in categories', async () => {
    const data = JSON.parse(REAL_JSON);
    data.items[5].category = 'nope';
    stubFetch(JSON.stringify(data));
    await expect(loadItems('/items.json')).rejects.toThrow('items[5].category');
  });

  it('rejects a file without items', async () => {
    stubFetch(JSON.stringify({ categories: [] }));
    await expect(loadItems('/items.json')).rejects.toThrow('items');
  });

  it('says which url and status failed', async () => {
    stubFetch('{}', { ok: false, status: 404 });
    await expect(loadItems('/missing.json')).rejects.toThrow(
      /404.*\/missing\.json|\/missing\.json.*404/,
    );
  });
});
