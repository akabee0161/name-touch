# Session Handover

## 進捗
作業: 幼児向け知育ゲーム
工程:
1. 共通素材を作る（forge のコピー・21 種類の絵・声・鳴き声・copy-assets.sh）（完了）
2. なまえタッチを作って公開する（完了）
3. ひな形を作り、残りの 8 本を作って公開する ← 今ここ
段階: 実装計画
次にやること:
- 工程 3 の計画は ankardo の HANDOVER.md の「進捗」にある。`src/common/` は ankardo の `templates/chiiku-game/` に切り出し済み（実機で音の解禁と再開、「？」の表示も確認済み、11-27）。共通の直しは ankardo のひな形が正で、ここへも写す

## 今の状態

- 公開済み: https://ankardo.com/play/name-touch/ （カタログ: https://ankardo.com/games/name-touch/ ）
- 遊び（`src/game/`: 種類ごとの 5 ページ・触って声とはねる・矢印・⏏ の長押しで戻る）まで動く。依頼者が横向きのスマホ・タブレット・PC の画面を承認済み
- 実機での声の聞こえ方・触り心地は未確認（消音スイッチは利用者の意思なので、消音を無視する設定は入れない。鳴らないときは、タイトル画面とゲーム画面の右上の「？」で、保護者に消音ボタンを確かめてもらう）
- 素材は ankardo の `shared-assets/chiiku/` のコピー（`chiiku-assets.md`）。名前の声は VOICEVOX:ずんだもん。鳴き声は入れていない（`--no-cry`）
- 本番デプロイは `main` へのマージで動く（`production` environment に保護ルールは無い。依頼者の判断）。`develop` へのマージで確認用のプレビュー（Cloudflare Access の後ろ）が上がる
- 計画は ankardo の `docs/superpowers/plans/2026-11-24-chiiku-games-step1-2.md`（ログ。現状と食い違うときは README と CLAUDE.md が正）。計画の「20 種類」は 21 種類（たべもの 5）、種類キー `fish` は `sea`（みずのいきもの）に読み替える
- `package-lock.json` は CI と同じ npm 10 で、`node_modules` の無い場所で作る（ankardo の `.claude/skills/new-game/SKILL.md` 参照）
