import type { ItemsFile } from '../common/assets';
import type { AudioPlayer } from '../common/audio';
import { createHelp } from '../common/help';
import { attachLongPress } from '../common/long-press';
import { buildPages } from './pages';

export type NameTouchDeps = {
  file: ItemsFile;
  audio: AudioPlayer;
  /** ゲームを終えるとき（⏏ の長押し）。タイトル画面に戻る */
  onExit: () => void;
};

const EXIT_HOLD_MS = 1500;
const BOUNCE_MS = 400;

/** 素材は、公開先（/play/name-touch/）の基準から読む。末尾のスラッシュ無しで開かれても外れない */
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}chiiku/${path}`;

/** 1 ページ 6 個までを、絵の大きさを保ったまま並べる列の数 */
const COLUMNS: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 2, 5: 3, 6: 3 };

function pictureButton(className: string, glyph: string, label: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('aria-label', label);
  button.textContent = glyph;
  return button;
}

export function startNameTouch(root: HTMLElement, deps: NameTouchDeps): void {
  const { audio, onExit } = deps;
  const pages = buildPages(deps.file);
  let pageIndex = 0;
  const bounceTimers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();

  const clearBounceTimers = () => {
    for (const timer of bounceTimers.values()) clearTimeout(timer);
    bounceTimers.clear();
  };

  const bounce = (el: HTMLElement) => {
    clearTimeout(bounceTimers.get(el));
    // 続けて叩いたときに、跳ねを最初からやり直す
    el.classList.remove('bounce');
    void el.offsetWidth;
    el.classList.add('bounce');
    bounceTimers.set(
      el,
      setTimeout(() => {
        el.classList.remove('bounce');
        bounceTimers.delete(el);
      }, BOUNCE_MS),
    );
  };

  const tap = (id: string, el: HTMLElement) => {
    bounce(el);
    // 声が読み込めなくても、遊びは続ける（前の声は audio.play が止める）
    audio.play(assetUrl(`voice/${id}.wav`)).catch((error: unknown) => {
      console.error(error);
    });
  };

  const goTo = (index: number) => {
    pageIndex = index;
    audio.stop();
    render();
  };

  // ⏏ はページを描き直しても同じものを使い、長押しの途中で消えないようにする
  const exit = pictureButton('exit-button', '⏏', 'おわる（ながおし）');
  attachLongPress(exit, EXIT_HOLD_MS, () => {
    clearBounceTimers();
    audio.stop();
    onExit();
  });

  // ？もページを描き直しても同じものを使い、開いている説明が消えないようにする
  const help = createHelp();

  function render() {
    clearBounceTimers();
    const page = pages[pageIndex];
    const screen = document.createElement('main');
    screen.className = 'play-screen';

    const grid = document.createElement('div');
    grid.className = 'items';
    const count = page?.items.length ?? 0;
    grid.style.setProperty('--cols', String(COLUMNS[count] ?? 3));
    grid.style.setProperty('--rows', String(Math.ceil(count / (COLUMNS[count] ?? 3)) || 1));
    // この画面の声を先に読み込む（最初に触ったときに、待たせないため）
    audio.preload((page?.items ?? []).map((item) => assetUrl(`voice/${item.id}.wav`)));

    for (const item of page?.items ?? []) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'item';
      button.dataset.id = item.id;
      button.setAttribute('aria-label', item.label);
      const img = document.createElement('img');
      img.src = assetUrl(`img/${item.id}.webp`);
      img.alt = '';
      img.draggable = false;
      button.append(img);
      // 子どもは指をすべらせて触ることが多い。click は指が動くと起きないので、触れた瞬間に鳴らす
      button.addEventListener('pointerdown', (e) => {
        // PC の右クリック・中クリックでは鳴らさない（タッチ・ペン・左クリックは button 0）
        if (e.button > 0) return;
        tap(item.id, button);
      });
      // キーボード（PC）: Enter・スペース。押しっぱなしの繰り返しでは鳴らさない
      button.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
          e.preventDefault();
          tap(item.id, button);
        }
      });
      grid.append(button);
    }

    screen.append(exit, help);
    if (pageIndex > 0) {
      const back = pictureButton('arrow arrow-left', '◀', 'まえ');
      back.addEventListener('click', () => goTo(pageIndex - 1));
      screen.append(back);
    }
    screen.append(grid);
    if (pageIndex < pages.length - 1) {
      const next = pictureButton('arrow arrow-right', '▶', 'つぎ');
      next.addEventListener('click', () => goTo(pageIndex + 1));
      screen.append(next);
    }

    root.replaceChildren(screen);
  }

  render();
}
