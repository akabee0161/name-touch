import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { type ItemsFile, parseItems } from '../common/assets';
import { buildPages } from './pages';

const real = parseItems(JSON.parse(readFileSync('public/chiiku/items.json', 'utf-8')));

describe('buildPages', () => {
  it('five pages in spec order', () => {
    const pages = buildPages(real);
    expect(pages.map((p) => p.category)).toEqual(['animal', 'insect', 'sea', 'vegetable', 'food']);
    expect(pages.map((p) => p.items.length)).toEqual([6, 3, 3, 4, 5]);
  });

  it('every item is on the page of its own category, in the order of the file', () => {
    for (const page of buildPages(real)) {
      expect(page.items.every((i) => i.category === page.category)).toBe(true);
    }
    expect(buildPages(real)[0]?.items.map((i) => i.id)).toEqual([
      'dog',
      'cat',
      'cow',
      'pig',
      'chicken',
      'elephant',
    ]);
  });

  it('puts every item on exactly one page', () => {
    const ids = buildPages(real).flatMap((p) => p.items.map((i) => i.id));
    expect(ids).toHaveLength(real.items.length);
    expect(new Set(ids).size).toBe(real.items.length);
  });

  it('skips a category that has no items', () => {
    const file: ItemsFile = {
      categories: [
        { key: 'a', label: 'A' },
        { key: 'empty', label: 'E' },
        { key: 'b', label: 'B' },
      ],
      items: [
        { id: 'x', category: 'a', label: 'x', kana: 'x', reading: 'x' },
        { id: 'y', category: 'b', label: 'y', kana: 'y', reading: 'y' },
      ],
    };
    expect(buildPages(file).map((p) => p.category)).toEqual(['a', 'b']);
  });
});
