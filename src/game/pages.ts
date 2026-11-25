import type { Item, ItemsFile } from '../common/assets';

export type Page = { category: string; items: Item[] };

/**
 * 種類ごとに 1 ページ。ページの並びは categories の順、ページの中の並びは items の順。
 * 絵が 1 つも無い種類のページは作らない。
 */
export function buildPages(file: ItemsFile): Page[] {
  return file.categories
    .map((category) => ({
      category: category.key,
      items: file.items.filter((item) => item.category === category.key),
    }))
    .filter((page) => page.items.length > 0);
}
