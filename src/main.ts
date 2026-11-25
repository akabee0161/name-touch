import { loadItems } from './common/assets';
import { createAudio } from './common/audio';
import './common/common.css';
import { showTitle } from './common/screens';

// なまえタッチで鳴らす声は VOICEVOX だけ（鳴き声は使わない）。ankardo の shared-assets/chiiku/CREDITS.md に従う
const CREDITS = ['VOICEVOX:ずんだもん'];

const root = document.getElementById('app');
if (!root) {
  throw new Error('#app が無い');
}
const app: HTMLElement = root;

async function main() {
  // 起動のときに、素材の一覧が読めて、形が合っていることを確かめる（壊れていれば下の catch で知らせる）
  await loadItems(`${import.meta.env.BASE_URL}chiiku/items.json`);
  const audio = createAudio();
  showTitle(app, {
    title: 'なまえタッチ',
    credits: CREDITS,
    unlock: () => audio.unlock(),
    onStart: () => {
      // 遊びの画面は Task 10 で、ここにつなぐ
    },
  });
}

main().catch((error: unknown) => {
  console.error(error);
  app.textContent = '読み込めませんでした。もう一度ひらいてください。';
});
