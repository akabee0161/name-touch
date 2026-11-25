// 長押しの検出。ゲームを終えるボタンに使う（子どもが間違えて押しても出ないように）。
// 知育ゲームで共通。ゲームごとの決まりを入れない。

/**
 * pointerdown から ms 続いたら 1 回だけ onFire を呼ぶ。
 * 指を離す・要素から出る・取り消されるときは、途中で止める。
 * 押している間にもう 1 本の指が触れても、数え直さず、2 回目も呼ばない。
 * 返り値の関数で外す（押している途中なら取り消す）。
 */
export function attachLongPress(el: HTMLElement, ms: number, onFire: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let held = false;

  const cancel = () => {
    held = false;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  const down = () => {
    if (held) return;
    held = true;
    timer = setTimeout(() => {
      timer = null;
      onFire();
    }, ms);
  };
  // 長押しで出る「コピー・保存」のメニュー（Android など）を出さない
  const noMenu = (e: Event) => e.preventDefault();

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointerleave', cancel);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('contextmenu', noMenu);

  return () => {
    cancel();
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointerup', cancel);
    el.removeEventListener('pointerleave', cancel);
    el.removeEventListener('pointercancel', cancel);
    el.removeEventListener('contextmenu', noMenu);
  };
}
